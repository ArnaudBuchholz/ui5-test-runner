import './style.css';

import { ReportController } from '../../reports/ui/ReportController.js';
import type { State } from '../../reports/ui/types.js';
import { renderHeader } from './components/Header.js';
import { renderSummaryBar } from './components/SummaryBar.js';
import { renderSuiteTree } from './components/SuiteTree.js';
import { renderToolbar } from './components/Toolbar.js';
import { renderThead, renderTableWindow, ROW_HEIGHT } from './components/TestTable.js';
import { renderConfiguration } from './components/Configuration.js';
import { debounce } from '../lib/utils/debounce.js';
import { readHash, writeHash } from './utils/hash.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';

const controller = new ReportController();

/** View-local state the controller does not own: which rows are expanded + measured heights. */
const expanded = new Set<number>();
const heights = new Map<number, number>();

function $(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

function currentHashState() {
  const { filterOnSuiteUid, filterOnStatus, search, sortBy, sortAscending } = controller.state;
  return { filterOnSuiteUid, filterOnStatus, search, sortBy, sortAscending };
}

// ---- Hidden file input for "Open…" -----------------------------------

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.style.display = 'none';
// eslint-disable-next-line @typescript-eslint/no-misused-promises
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) {
    return;
  }
  const report = JSON.parse(await file.text()) as CommonTestReport;
  expanded.clear();
  heights.clear();
  controller.interaction({ report });
  fileInput.value = '';
});

// ---- Rendering --------------------------------------------------------

function renderOpenMode(): string {
  return `<div class="open-mode">
  <h1>UI5 Test Runner Report</h1>
  <button id="openBtn" class="btn btn--primary">Open Report</button>
</div>`;
}

function renderDisplayMode(): string {
  return (
    renderHeader(controller.state) +
    renderSummaryBar(controller.state) +
    `<div class="main">
      ${renderSuiteTree(controller.state)}
      <div class="content">
        ${renderToolbar(controller.state, controller.settings)}
        ${renderThead()}
        <div class="table" id="table"></div>
        ${renderConfiguration(controller.state)}
      </div>
    </div>`
  );
}

function renderApp(): void {
  const app = $('#app');
  if (!app) {
    return;
  }
  app.innerHTML = controller.state.mode === 'display' ? renderDisplayMode() : renderOpenMode();
  if (controller.state.mode === 'display') {
    renderTable();
    attachDisplayEvents();
  } else {
    $('#openBtn')?.addEventListener('click', () => fileInput.click());
  }
}

/** Re-render only the virtualized window for the current scroll position. */
function renderTable(): void {
  const table = $('#table');
  if (!table) {
    return;
  }
  table.innerHTML = renderTableWindow(
    controller.state,
    expanded,
    heights,
    table.scrollTop,
    table.clientHeight || window.innerHeight
  );
  measureExpanded(table);
}

/**
Measure rendered expanded rows. If a measured height differs from what the window
was laid out with, store it and re-render so the sizer/offsets reconcile.
*/
function measureExpanded(table: HTMLElement): void {
  let isChanged = false;
  for (const index of expanded) {
    const row = table.querySelector(`.row[data-index="${CSS.escape(String(index))}"]`);
    if (!row) {
      continue;
    }
    const measured = (row as HTMLElement).offsetHeight;
    if (Math.abs((heights.get(index) ?? ROW_HEIGHT) - measured) <= 1) {
      continue;
    }
    heights.set(index, measured);
    isChanged = true;
  }
  if (!isChanged) {
    return;
  }
  const clientHeight = table.clientHeight || window.innerHeight;
  table.innerHTML = renderTableWindow(controller.state, expanded, heights, table.scrollTop, clientHeight);
}

// ---- Image lazy-load (attachments / screenshots) ----------------------

function loadImages(scope: HTMLElement): void {
  scope.querySelectorAll<HTMLImageElement>('img.att__thumb[data-src]').forEach((img) => {
    if (img.getAttribute('src')) {
      return;
    }
    img.src = img.dataset['src'] ?? '';
    img.addEventListener(
      'error',
      () => {
        img.removeAttribute('src');
        img.classList.add('att__thumb--error');
        img.textContent = 'Unavailable';
        img.title = `Unavailable: ${img.dataset['src'] ?? ''}`;
      },
      { once: true }
    );
    img.addEventListener('click', () => window.open(img.dataset['src'], '_blank'));
  });
}

// ---- Event wiring -----------------------------------------------------

function toggleTheme(): void {
  const root = document.documentElement;
  const current =
    root.dataset['theme'] ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.dataset['theme'] = current === 'dark' ? 'light' : 'dark';
}

const debouncedSearch = debounce((value: string) => {
  expanded.clear();
  heights.clear();
  controller.interaction({ search: value });
  writeHash(currentHashState());
}, 250);

function attachHeaderEvents(): void {
  $('#openBtn')?.addEventListener('click', () => fileInput.click());
  $('#exportBtn')?.addEventListener('click', () => controller.interaction({ action: 'export' }));
  $('#themeBtn')?.addEventListener('click', toggleTheme);
}

function attachToolbarEvents(): void {
  $('#statusSelect')?.addEventListener('change', (event) => {
    expanded.clear();
    heights.clear();
    controller.interaction({ filterOnStatus: (event.target as HTMLSelectElement).value as State['filterOnStatus'] });
    writeHash(currentHashState());
  });

  $('#searchInput')?.addEventListener('input', (event) => debouncedSearch((event.target as HTMLInputElement).value));

  $('#sortSelect')?.addEventListener('change', (event) => {
    expanded.clear();
    heights.clear();
    controller.interaction({ sortBy: (event.target as HTMLSelectElement).value as State['sortBy'] });
    writeHash(currentHashState());
  });

  $('#sortDirBtn')?.addEventListener('click', () => {
    expanded.clear();
    heights.clear();
    controller.interaction({ sortAscending: !controller.state.sortAscending });
    writeHash(currentHashState());
  });
}

function attachSuiteTreeEvents(): void {
  $('#suiteTree')?.addEventListener('click', (event) => {
    const node = (event.target as Element).closest('[data-suite-uid]');
    if (!node) {
      return;
    }
    expanded.clear();
    heights.clear();
    const uid = decodeURIComponent((node as HTMLElement).dataset['suiteUid'] ?? '');
    controller.interaction({ filterOnSuiteUid: uid });
    writeHash(currentHashState());
  });
}

/** Flip a leading twisty glyph (▸ collapsed / ▾ expanded) on a toggle's label. */
function setTwisty(element: Element, isOpen: boolean): void {
  const text = (element.textContent ?? '').replace(/^[▸▾]\s*/, '');
  element.textContent = `${isOpen ? '▾' : '▸'} ${text}`;
}

function toggleAssertions(table: HTMLElement, toggle: Element): void {
  const index = (toggle as HTMLElement).dataset['assertIndex'] ?? '';
  const body = table.querySelector<HTMLElement>(`.assert-body[data-assert-index="${CSS.escape(index)}"]`);
  if (!body) {
    return;
  }
  const isOpen = body.style.display === 'none';
  body.style.display = isOpen ? 'block' : 'none';
  setTwisty(toggle, isOpen);
  measureExpanded(table);
}

function toggleRow(table: HTMLElement, index: number): void {
  if (expanded.has(index)) {
    expanded.delete(index);
    heights.delete(index);
  } else {
    expanded.add(index);
  }
  renderTable();
  const row = table.querySelector(`.row[data-index="${CSS.escape(String(index))}"]`);
  if (row) {
    loadImages(row as HTMLElement);
  }
}

function attachTableEvents(): void {
  const table = $('#table');
  if (!table) {
    return;
  }

  table.addEventListener('scroll', () => renderTable(), { passive: true });

  table.addEventListener('click', (event) => {
    const target = event.target as Element;
    const assertToggle = target.closest('.assert-toggle');
    if (assertToggle) {
      toggleAssertions(table, assertToggle);
      return;
    }
    const head = target.closest('.row__head');
    if (head) {
      toggleRow(table, Number((head as HTMLElement).dataset['index']));
    }
  });
}

function attachConfigEvents(): void {
  $('#configToggle')?.addEventListener('click', () => {
    const json = $('#configJson');
    const toggle = $('#configToggle');
    if (!json || !toggle) {
      return;
    }
    const isOpen = json.style.display === 'none';
    json.style.display = isOpen ? 'block' : 'none';
    toggle.setAttribute('aria-expanded', String(isOpen));
    setTwisty(toggle, isOpen);
  });
}

function attachDisplayEvents(): void {
  attachHeaderEvents();
  attachToolbarEvents();
  attachSuiteTreeEvents();
  attachTableEvents();
  attachConfigEvents();
}

// ---- Controller update callback ---------------------------------------

function update(changed: Partial<State>): void {
  // Any state change in display mode re-renders the shell; `mode` flips open↔display.
  if ('mode' in changed || 'report' in changed || 'tests' in changed) {
    renderApp();
  }
}

// ---- Popstate (back/forward) ------------------------------------------

window.addEventListener('popstate', () => {
  const hashState = readHash();
  if (Object.keys(hashState).length === 0) {
    return;
  }

  expanded.clear();
  heights.clear();
  controller.interaction(hashState as Partial<State>);
});

// ---- Boot -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  document.body.append(fileInput);
  controller.connect(update);

  if ('ctrf' in window && typeof window.ctrf === 'object' && window.ctrf) {
    controller.interaction({ report: window.ctrf as CommonTestReport });
  }

  const initialHash = readHash();
  if (Object.keys(initialHash).length > 0) {
    controller.interaction(initialHash as Partial<State>);
  }

  renderApp();
});
