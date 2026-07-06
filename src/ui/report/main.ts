import '../lib/index.js';

import './style.css';

import { ReportController } from '../../reports/ui/ReportController.js';
import type { State } from '../../reports/ui/types.js';
import { renderSummary } from './components/Summary.js';
import { renderFilterBar, renderSuitePopoverContent } from './components/FilterBar.js';
import { renderTestList, renderTestListBody } from './components/TestList.js';
import { debounce } from '../lib/utils/debounce.js';
import { readHash, writeHash } from './utils/hash.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';

const controller = new ReportController();

type UI5Element = Record<string, unknown>;

function asUI5(element: Element): UI5Element {
  return element as unknown as UI5Element;
}

function asHtml(element: Element | null): HTMLElement | null {
  return element as HTMLElement | null;
}

function currentHashState() {
  const s = controller.state;
  return {
    filterOnSuiteUid: s.filterOnSuiteUid,
    filterOnStatus: s.filterOnStatus,
    search: s.search,
    sortBy: s.sortBy,
    sortAscending: s.sortAscending
  };
}

// ---- Popover (injected once, before #app) ----

function injectPopovers(): void {
  const app = document.querySelector('#app');
  if (!app) return;
  app.insertAdjacentHTML(
    'beforebegin',
    `<ui5-popover id="suitePopover" header-text="Suite filter" placement="Bottom" style="max-width: 320px;">
      <div id="suitePopoverContent" style="padding: 0.5rem; min-width: 240px; max-height: 300px; overflow-y: auto;"></div>
      <div slot="footer" style="display:flex;justify-content:flex-end;padding:0.5rem;">
        <ui5-button id="suitePopoverClose" design="Transparent">Close</ui5-button>
      </div>
    </ui5-popover>`
  );
}

function updateSuitePopover(): void {
  const content = document.querySelector('#suitePopoverContent');
  if (!content) return;
  content.innerHTML = renderSuitePopoverContent(controller.state.suites, controller.state.filterOnSuiteUid);
}

// ---- File input (created once, lives on body) ----

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.style.display = 'none';

// eslint-disable-next-line @typescript-eslint/no-misused-promises
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const text = await file.text();
  const report = JSON.parse(text) as CommonTestReport;
  controller.interaction({ report });
  fileInput.value = '';
});

// ---- Render ----

function renderDisplayMode(): string {
  return (
    renderSummary(controller.state) +
    renderFilterBar(controller.state, controller.settings) +
    renderTestList(controller.state, controller.settings)
  );
}

function renderOpenMode(): string {
  return `<div class="open-mode">
  <ui5-title level="H2">UI5 Test Runner Report</ui5-title>
  <ui5-button id="openBtn" design="Emphasized">Open Report</ui5-button>
</div>`;
}

function renderApp(): void {
  const app = document.querySelector('#app');
  if (!app) return;
  app.innerHTML = controller.state.mode === 'display' ? renderDisplayMode() : renderOpenMode();
  updateSuitePopover();
  attachEvents();
}

function updateTestListContent(): void {
  const container = document.querySelector('#testList');
  if (!container) return;
  container.innerHTML = renderTestListBody(controller.state, controller.settings);
  attachTestRowsEvents();
  attachSortEvents();
}

function updateSuiteButton(): void {
  const button = document.querySelector('#suiteFilterBtn');
  if (!button) return;
  const uid = controller.state.filterOnSuiteUid;
  const flatSuites = (function flatten(suites: typeof controller.state.suites): typeof controller.state.suites {
    return suites.flatMap((s) => [s, ...flatten(s.suites)]);
  })(controller.state.suites);
  const label = uid ? (flatSuites.find((s) => s.uid === uid)?.label ?? 'Unknown suite') : 'All suites';
  button.textContent = `${label} ▾`;
}

// ---- Event attachment ----

function attachOpenExportEvents(): void {
  document.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (target.closest('#openBtn')) {
      fileInput.click();
    }
    if (target.closest('#exportBtn')) {
      controller.interaction({ action: 'export' });
    }
  });
}

function attachSuitePopoverEvents(): void {
  const suitePopoverClose = document.querySelector('#suitePopoverClose');
  suitePopoverClose?.addEventListener('click', () => {
    asUI5(document.querySelector('#suitePopover')!)['open'] = false;
  });
}

function attachFilterBarEvents(): void {
  const suiteButton = document.querySelector('#suiteFilterBtn');
  suiteButton?.addEventListener('click', (event) => {
    updateSuitePopover();
    const popover = document.querySelector('#suitePopover');
    if (popover) {
      asUI5(popover)['opener'] = event.currentTarget;
      asUI5(popover)['open'] = true;
    }
  });

  const suiteContent = document.querySelector('#suitePopoverContent');
  suiteContent?.addEventListener('click', (event) => {
    const item = asHtml((event.target as Element).closest('[data-suite-uid]'));
    if (!item) return;
    const uid = decodeURIComponent(item.dataset['suiteUid'] ?? '');
    controller.interaction({ filterOnSuiteUid: uid });
    writeHash(currentHashState());
    updateSuiteButton();
    asUI5(document.querySelector('#suitePopover')!)['open'] = false;
  });

  const statusSelect = document.querySelector('#statusSelect');
  statusSelect?.addEventListener('change', (event) => {
    const detail = (event as unknown as { detail: { selectedOption: { value: string } } }).detail;
    controller.interaction({ filterOnStatus: detail.selectedOption.value as State['filterOnStatus'] });
    writeHash(currentHashState());
  });

  const searchInput = document.querySelector('#searchInput');
  const debouncedSearch = debounce((value: string) => {
    controller.interaction({ search: value });
    writeHash(currentHashState());
  }, 250);

  searchInput?.addEventListener('input', (event) => {
    const target = event.target as unknown as { value: string };
    debouncedSearch(target.value);
  });

  searchInput?.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key !== 'Enter') {
      return;
    }

    const target = event.target as unknown as { value: string };
    controller.interaction({ search: target.value });
    writeHash(currentHashState());
  });
}

function attachSortEvents(): void {
  const sortRow = document.querySelector('#sortRow');
  sortRow?.addEventListener('click', (event) => {
    const button = asHtml((event.target as Element).closest('.sort-btn'));
    if (!button) return;
    const key = (button.dataset['sortKey'] ?? '') as State['sortBy'];
    const { sortBy, sortAscending } = controller.state;

    if (key === '') {
      controller.interaction({ sortBy: '' });
    } else if (sortBy !== key) {
      controller.interaction({ sortBy: key });
    } else if (sortAscending) {
      controller.interaction({ sortAscending: false });
    } else {
      controller.interaction({ sortBy: '' });
    }
    writeHash(currentHashState());
  });
}

function toggleTestRow(testRows: Element, index: string): void {
  const details = asHtml(testRows.querySelector(`.test-row-details[data-index="${CSS.escape(index)}"]`));
  if (!details) return;
  const toggleButton = asHtml(testRows.querySelector(`.test-toggle-btn[data-index="${CSS.escape(index)}"]`));
  const isOpen = details.style.display !== 'none';
  details.style.display = isOpen ? 'none' : 'block';
  if (toggleButton) toggleButton.textContent = isOpen ? '[>]' : '[V]';
}

function attachTestRowsEvents(): void {
  const testRows = document.querySelector('#testRows');
  if (!testRows) return;

  testRows.addEventListener('click', (event) => {
    const target = event.target as Element;

    const toggleButton = asHtml(target.closest('.test-toggle-btn'));
    if (toggleButton) {
      event.stopPropagation();
      toggleTestRow(testRows, toggleButton.dataset['index'] ?? '');
      return;
    }

    const rowHeader = asHtml(target.closest('.test-row-header'));
    if (rowHeader && !target.closest('ui5-breadcrumbs')) {
      toggleTestRow(testRows, rowHeader.dataset['index'] ?? '');
    }
  });

  testRows.addEventListener('item-click', (event) => {
    const detail = (event as CustomEvent<{ item: HTMLElement }>).detail;
    const uid = decodeURIComponent(detail.item.dataset['suiteUid'] ?? '');
    controller.interaction({ filterOnSuiteUid: uid });
    writeHash(currentHashState());
    updateSuiteButton();
    updateSuitePopover();
  });
}

function attachEvents(): void {
  attachFilterBarEvents();
  attachSortEvents();
  attachTestRowsEvents();
}

// ---- Controller update callback ----

function update(changed: Partial<State>): void {
  if ('mode' in changed) {
    renderApp();
    return;
  }
  if ('tests' in changed) {
    updateTestListContent();
  }
}

// ---- Popstate (back/forward navigation) ----

globalThis.addEventListener('popstate', () => {
  const hashState = readHash();
  if (Object.keys(hashState).length > 0) {
    controller.interaction(hashState as Partial<State>);
  }
  updateSuiteButton();
});

// ---- Boot ----

document.addEventListener('DOMContentLoaded', () => {
  document.body.append(fileInput);
  injectPopovers();
  attachOpenExportEvents();
  attachSuitePopoverEvents();
  controller.connect(update);

  const initialHash = readHash();
  if (Object.keys(initialHash).length > 0) {
    controller.interaction(initialHash as Partial<State>);
  }

  renderApp();
});
