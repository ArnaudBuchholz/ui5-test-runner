import '../lib/index.js';

import './style.css';

import { LogViewerController } from '../../modes/log/ui/LogViewerController.js';
import type { State } from '../../modes/log/ui/types.js';
import { renderTopBar } from './components/TopBar.js';
import { renderFacetRail } from './components/FacetRail.js';
import { renderEventStream } from './components/EventStream.js';
import { debounce } from '../lib/utils/debounce.js';
import { compileFilter, toggleFacet } from './utils/filter.js';
import type { FacetField, FacetSelection } from './utils/filter.js';

const controller = new LogViewerController();

/** View-local state the controller does not own. */
type ViewState = {
  facets: FacetSelection;
  freeExpression: string;
  order: 'asc' | 'desc';
  /** Index into controller.state.logs of the inline-expanded row, or -1. */
  expandedIndex: number;
};

/**
Default de-noise: hide the high-volume, low-signal sources so the first screen shows
what matters. Users re-enable them from the Source facet or by editing the expression.
*/
const DEFAULT_EXPRESSION = 'source !== "metric" && source !== "progress" && !source.includes("stdout")';

const view: ViewState = {
  facets: new Map(),
  freeExpression: DEFAULT_EXPRESSION,
  order: 'desc',
  expandedIndex: -1
};

function $(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

/** Push the compiled filter into the controller and refresh from the server. */
function applyFilter(): void {
  const filter = compileFilter(view.facets, view.freeExpression);
  view.expandedIndex = -1;
  controller.interaction({ filter, action: 'refresh_now' });
}

function renderRail(): void {
  const rail = $('#ev-rail');
  if (rail) {
    rail.innerHTML = renderFacetRail(controller.state.logs, view.facets);
  }
}

function renderStream(): void {
  const stream = $('#ev-stream');
  if (stream) {
    stream.innerHTML = renderEventStream(controller.state.logs, {
      order: view.order,
      expandedIndex: view.expandedIndex
    });
  }
}

function renderBar(): void {
  const bar = $('#ev-topbar');
  if (!bar) {
    return;
  }

  bar.innerHTML = renderTopBar(controller.state, controller.settings, {
    freeExpression: view.freeExpression,
    order: view.order
  });
  attachBarEvents();
}

function showError(): void {
  const banner = $('#ev-error');
  if (!banner) {
    return;
  }
  const message = controller.state.errorMessage;
  banner.textContent = message;
  banner.style.display = message ? 'block' : 'none';
}

const debouncedExpression = debounce((value: string) => {
  view.freeExpression = value;
  applyFilter();
}, 300);

function attachBarEvents(): void {
  const filterInput = $('#ev-filter') as HTMLInputElement | null;
  filterInput?.addEventListener('input', () => debouncedExpression(filterInput.value));

  $('#ev-filter-clear')?.addEventListener('click', () => {
    view.freeExpression = '';
    if (filterInput) {
      filterInput.value = '';
    }
    applyFilter();
  });

  $('#ev-timetype')?.addEventListener('change', (event) => {
    const value = (event.target as HTMLSelectElement).value as State['timerangeType'];
    controller.interaction({ timerangeType: value, action: 'refresh_now' });
  });

  $('#ev-relative')?.addEventListener('change', (event) => {
    const value = Number((event.target as HTMLSelectElement).value) as State['relativeTimerange'];
    controller.interaction({ relativeTimerange: value, action: 'refresh_now' });
  });

  $('#ev-refresh')?.addEventListener('change', (event) => {
    const raw = (event.target as HTMLSelectElement).value;
    controller.interaction(
      raw === 'none'
        ? { autorefresh: false }
        : { autorefresh: true, autorefreshInterval: Number(raw) as State['autorefreshInterval'] }
    );
  });

  $('#ev-refresh-now')?.addEventListener('click', () => controller.interaction({ action: 'refresh_now' }));

  $('#ev-order')?.addEventListener('click', () => {
    view.order = view.order === 'desc' ? 'asc' : 'desc';
    renderStream();
    renderBar();
  });
}

function attachRailEvents(): void {
  $('#ev-rail')?.addEventListener('click', (event) => {
    const facetButton = (event.target as Element).closest('.ev-facet-item');
    if (facetButton) {
      const field = (facetButton as HTMLElement).dataset['facet'] as FacetField;
      const key = (facetButton as HTMLElement).dataset['key'] ?? '';
      view.facets = toggleFacet(view.facets, field, key);
      applyFilter();
      return;
    }
    const issueButton = (event.target as Element).closest('.ev-issue');
    if (issueButton && !(issueButton as HTMLButtonElement).disabled) {
      applyIssueFilter((issueButton as HTMLElement).dataset);
    }
  });
}

function applyIssueFilter(dataset: DOMStringMap): void {
  const issue = dataset['issue'];
  if (issue === 'errors') {
    view.freeExpression = 'level === "error" || level === "fatal"';
  } else if (issue === 'warns') {
    view.freeExpression = 'level === "warn"';
  } else if (issue === 'failingPages') {
    const pages = (dataset['pages'] ?? '').split(',').filter(Boolean);
    view.freeExpression = pages.map((p) => `pageId === ${p}`).join(' || ');
  }
  view.facets = new Map();
  applyFilter();
}

function attachStreamEvents(): void {
  $('#ev-stream')?.addEventListener('click', (event) => {
    const chip = (event.target as Element).closest('.ev-filter-btn');
    if (chip) {
      applyChipFilter(chip as HTMLElement);
      event.stopPropagation();
      return;
    }
    const row = (event.target as Element).closest('.ev-row');
    if (!row) {
      return;
    }
    const index = Number((row as HTMLElement).dataset['index']);
    view.expandedIndex = view.expandedIndex === index ? -1 : index;
    renderStream();
  });
}

function applyChipFilter(chip: HTMLElement): void {
  const field = chip.dataset['field'] ?? '';
  const op = chip.dataset['op'] ?? '===';
  let value: unknown;
  try {
    value = JSON.parse(chip.dataset['value'] ?? 'null');
  } catch {
    value = chip.dataset['value'];
  }
  const formatted = typeof value === 'string' ? `"${value}"` : String(value);
  const clause = `${field} ${op} ${formatted}`;
  view.freeExpression = view.freeExpression ? `${view.freeExpression} && ${clause}` : clause;
  applyFilter();
}

/** React to controller state changes. */
function update(changed: Partial<State>): void {
  if ('metrics' in changed) {
    renderBar();
  }
  if ('logs' in changed) {
    renderStream();
    renderRail();
  }
  if ('errorMessage' in changed) {
    showError();
  }
}

function renderShell(): void {
  const app = $('#app');
  if (!app) {
    return;
  }
  app.innerHTML = `
    <div id="ev-topbar"></div>
    <div id="ev-error" style="display:none"></div>
    <div id="ev-main">
      <aside id="ev-rail"></aside>
      <section id="ev-stream"></section>
    </div>`;
  renderBar();
  renderRail();
  renderStream();
  attachRailEvents();
  attachStreamEvents();
}

document.addEventListener('DOMContentLoaded', () => {
  renderShell();
  controller.connect(update);
  // The controller's initial query is unfiltered; apply the de-noise default immediately.
  applyFilter();
});
