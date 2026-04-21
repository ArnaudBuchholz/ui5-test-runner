import '@ui5/webcomponents/dist/Input.js';
import '@ui5/webcomponents/dist/Select.js';
import '@ui5/webcomponents/dist/Option.js';
import '@ui5/webcomponents/dist/DateTimePicker.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/MessageStrip.js';
import '@ui5/webcomponents/dist/Popover.js';
import '@ui5/webcomponents/dist/CheckBox.js';

import './style.css';

import { LogViewerController } from '../../modes/log/ui/LogViewerController.js';
import type { State } from '../../modes/log/ui/types.js';
import { renderHeader } from './components/Header.js';
import { renderToolbar } from './components/Toolbar.js';
import { renderLogTable } from './components/LogTable.js';
import { renderLogDetails } from './components/LogDetails.js';
import { debounce } from './utils/debounce.js';
import { buildFilterExpression } from './utils/filter.js';
import { formatTimestamp, formatBytes } from './utils/format.js';

const controller = new LogViewerController();

type UI5Element = Record<string, unknown>;

function asUI5(element: Element): UI5Element {
  return element as unknown as UI5Element;
}

function renderMetricsContent(): string {
  const m = controller.state.metrics;
  return `<div class="log-details-row"><span class="log-details-label">Status</span>
      <span>${m.reading ? 'Live (reading)' : 'Replay (complete)'}</span></div>
    <div class="log-details-row"><span class="log-details-label">Log count</span>
      <span>${m.logCount}</span></div>
    <div class="log-details-row"><span class="log-details-label">Input size</span>
      <span>${formatBytes(m.inputSize)}</span></div>
    <div class="log-details-row"><span class="log-details-label">Output size</span>
      <span>${formatBytes(m.outputSize)}</span></div>
    <div class="log-details-row"><span class="log-details-label">Chunks</span>
      <span>${m.chunksCount}</span></div>
    <div class="log-details-row"><span class="log-details-label">From</span>
      <span>${formatTimestamp(m.minTimestamp)}</span></div>
    <div class="log-details-row"><span class="log-details-label">To</span>
      <span>${formatTimestamp(m.maxTimestamp)}</span></div>`;
}

function renderLevelFilterContent(): string {
  const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
  return levels
    .map(
      (l) => `<div class="column-filter-row"><ui5-checkbox data-filter-value="${l}" text="${l}"></ui5-checkbox></div>`
    )
    .join('');
}

function renderValueFilterContent(field: string, logs: State['logs']): string {
  // eslint-disable-next-line sonarjs/no-alphabetical-sort -- Good enough
  const values = [...new Set(logs.map((log) => (log as unknown as Record<string, unknown>)[field]))].toSorted();
  return values
    .map(
      (v) =>
        `<div class="column-filter-row"><ui5-checkbox data-filter-value='${JSON.stringify(v)}' text="${String(v)}"></ui5-checkbox></div>`
    )
    .join('');
}

function applyColumnFilter(field: string): void {
  const content = document.querySelector('#columnFilterPopoverContent');
  if (!content) return;
  const checked = [...content.querySelectorAll('ui5-checkbox')].filter(
    (callback) => (asUI5(callback)['checked'] as boolean) === true
  );
  if (checked.length === 0) return;
  const values = checked.map((callback) => {
    const raw = (callback as HTMLElement).dataset['filterValue'] ?? 'null';
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  });
  const parts = values.map((v) => buildFilterExpression(field, v, '===', ''));
  const clause = values.length > 1 ? `(${parts.join(' || ')})` : parts[0]!;
  const newFilter = controller.state.filter ? `${controller.state.filter} && ${clause}` : clause;
  controller.interaction({ filter: newFilter });
  const filterInput = document.querySelector('#filterInput');
  if (filterInput) {
    (filterInput as unknown as HTMLInputElement).value = newFilter;
  }
  asUI5(document.querySelector('#columnFilterPopover')!)['open'] = false;
}

function attachFilterButtonEvents(container: Element): void {
  for (const button of container.querySelectorAll('.filter-add-btn, .filter-remove-btn')) {
    button.addEventListener('click', () => {
      const htmlButton = button as HTMLElement;
      const field = htmlButton.dataset['field'] ?? '';
      const rawValue = htmlButton.dataset['value'] ?? 'null';
      const op = (htmlButton.dataset['op'] ?? '===') as '===' | '!==';
      let value: unknown;
      try {
        value = JSON.parse(rawValue) as unknown;
      } catch {
        value = rawValue;
      }
      const newFilter = buildFilterExpression(field, value, op, controller.state.filter);
      controller.interaction({ filter: newFilter });
      const filterInput = document.querySelector('#filterInput');
      if (filterInput) {
        (filterInput as unknown as HTMLInputElement).value = newFilter;
      }
    });
  }
}

function attachToolbarEvents(): void {
  const filterInput = document.querySelector('#filterInput');
  const debouncedFilter = debounce((value: string) => controller.interaction({ filter: value }), 250);
  filterInput?.addEventListener('input', (event) => {
    const target = event.target as unknown as { value: string };
    debouncedFilter(target.value);
  });

  const timerangeTypeSelect = document.querySelector('#timerangeTypeSelect');
  timerangeTypeSelect?.addEventListener('change', (event) => {
    const detail = (event as unknown as { detail: { selectedOption: { value: string } } }).detail;
    controller.interaction({ timerangeType: detail.selectedOption.value as 'relative' | 'absolute' });
  });

  const relativeTimerangeSelect = document.querySelector('#relativeTimerangeSelect');
  relativeTimerangeSelect?.addEventListener('change', (event) => {
    const detail = (event as unknown as { detail: { selectedOption: { value: string } } }).detail;
    controller.interaction({ relativeTimerange: Number(detail.selectedOption.value) as State['relativeTimerange'] });
  });

  const autorefreshSelect = document.querySelector('#autorefreshSelect');
  autorefreshSelect?.addEventListener('change', (event) => {
    const detail = (event as unknown as { detail: { selectedOption: { value: string } } }).detail;
    const value = detail.selectedOption.value;
    if (value === 'none') {
      controller.interaction({ autorefresh: false });
    } else {
      controller.interaction({ autorefresh: true, autorefreshInterval: Number(value) as State['autorefreshInterval'] });
    }
  });

  const fromPicker = document.querySelector('#absoluteFromPicker');
  fromPicker?.addEventListener('change', (event) => {
    const target = event.target as unknown as { dateValue: Date };
    if (target.dateValue) {
      controller.interaction({ absoluteTimerangeFrom: target.dateValue.getTime() });
    }
  });

  const toPicker = document.querySelector('#absoluteToPicker');
  toPicker?.addEventListener('change', (event) => {
    const target = event.target as unknown as { dateValue: Date };
    if (target.dateValue) {
      controller.interaction({ absoluteTimerangeTo: target.dateValue.getTime() });
    }
  });

  const refreshButton = document.querySelector('#refreshNowBtn');
  refreshButton?.addEventListener('click', () => controller.interaction({ action: 'refresh_now' }));
}

function attachColumnHeaderEvents(thead: Element): void {
  thead.addEventListener('click', (event) => {
    const th = (event.target as Element).closest('th[data-col]');
    if (!th) return;
    const col = (th as HTMLElement).dataset['col'];
    if (!col) return;

    const logs = controller.state.logs;
    const popover = document.querySelector('#columnFilterPopover');
    const content = document.querySelector('#columnFilterPopoverContent');
    if (!popover || !content) return;

    if (col === 'timestamp') {
      if (logs.length === 0) return;
      const timestamps = logs.map((l) => l.timestamp);
      const minTs = Math.min(...timestamps);
      const maxTs = Math.max(...timestamps);
      controller.interaction({
        timerangeType: 'absolute',
        absoluteTimerangeFrom: minTs,
        absoluteTimerangeTo: maxTs
      });
      return;
    }

    content.innerHTML = col === 'level' ? renderLevelFilterContent() : renderValueFilterContent(col, logs);

    const applyButton = document.querySelector('#columnFilterApply');
    const newApplyButton = applyButton?.cloneNode(true) as Element | undefined;
    if (applyButton && newApplyButton) {
      applyButton.replaceWith(newApplyButton);
      newApplyButton.addEventListener('click', () => applyColumnFilter(col === 'level' ? 'level' : col));
    }

    asUI5(popover)['opener'] = th;
    asUI5(popover)['open'] = true;
  });
}

function attachEvents(): void {
  attachToolbarEvents();

  const statusButton = document.querySelector('#statusBtn');
  statusButton?.addEventListener('click', (event) => {
    const popover = document.querySelector('#metricsPopover');
    const content = document.querySelector('#metricsPopoverContent');
    if (popover && content) {
      content.innerHTML = renderMetricsContent();
      asUI5(popover)['opener'] = event.currentTarget;
      asUI5(popover)['open'] = true;
    }
  });

  const thead = document.querySelector('#logTable thead');
  if (thead) {
    attachColumnHeaderEvents(thead);
  }

  const tbody = document.querySelector('#logTable tbody');
  if (tbody) {
    attachTbodyClickEvent(tbody);
  }

  const closeButton = document.querySelector('#logDetailsClose');
  closeButton?.addEventListener('click', () => {
    const popover = document.querySelector('#logDetailsPopover');
    if (popover) {
      asUI5(popover)['open'] = false;
    }
  });
}

function renderApp(): void {
  const app = document.querySelector('#app');
  if (!app) return;
  const { state, settings } = controller;
  app.innerHTML =
    renderHeader(state.metrics) +
    `<div id="toolbar">${renderToolbar(state, settings)}</div>` +
    `<div id="logTableWrapper"><table id="logTable">${renderLogTable(state.logs)}</table></div>`;
  attachEvents();
}

function rerenderToolbar(): void {
  const toolbar = document.querySelector('#toolbar');
  if (toolbar) {
    toolbar.innerHTML = renderToolbar(controller.state, controller.settings);
    attachToolbarEvents();
  }
}

function updateMetrics(): void {
  const statusButton = document.querySelector('#statusBtn');
  if (!statusButton) return;
  const isLive = controller.state.metrics.reading;
  statusButton.textContent = isLive ? 'Status: Live' : 'Status: Replay';
  statusButton.setAttribute('design', isLive ? 'Positive' : 'Neutral');
}

function attachTbodyClickEvent(tbody: Element): void {
  tbody.addEventListener('click', (event) => {
    const row = (event.target as Element).closest('tr[data-index]');
    if (!row) return;
    const index = Number((row as HTMLElement).dataset['index']);
    const log = controller.state.logs[index];
    if (!log) return;
    const popover = document.querySelector('#logDetailsPopover');
    const content = document.querySelector('#logDetailsPopoverContent');
    if (popover && content) {
      content.innerHTML = renderLogDetails(log);
      attachFilterButtonEvents(content);
      asUI5(popover)['opener'] = row;
      asUI5(popover)['open'] = true;
    }
  });
}

function updateLogs(): void {
  const table = document.querySelector('#logTable');
  if (!table) return;
  table.innerHTML = renderLogTable(controller.state.logs);
  const thead = table.querySelector('thead');
  if (thead) {
    attachColumnHeaderEvents(thead);
  }
  const tbody = table.querySelector('tbody');
  if (tbody) {
    attachTbodyClickEvent(tbody);
  }
}

function updateErrorMessage(): void {
  const toolbar = document.querySelector('#toolbar');
  if (!toolbar) return;
  const existing = document.querySelector('#errorStrip');
  if (controller.state.errorMessage) {
    if (existing) {
      existing.textContent = controller.state.errorMessage;
    } else {
      toolbar.insertAdjacentHTML(
        'beforeend',
        `<ui5-message-strip id="errorStrip" design="Negative" hide-close-button>${controller.state.errorMessage}</ui5-message-strip>`
      );
    }
  } else {
    existing?.remove();
  }
}

const TOOLBAR_FIELDS: ReadonlyArray<keyof State> = [
  'timerangeType',
  'relativeTimerange',
  'autorefresh',
  'autorefreshInterval',
  'absoluteTimerangeFrom',
  'absoluteTimerangeTo'
];

function update(changed: Partial<State>): void {
  if (TOOLBAR_FIELDS.some((f) => f in changed)) {
    rerenderToolbar();
  }
  if ('metrics' in changed) {
    updateMetrics();
  }
  if ('logs' in changed) {
    updateLogs();
  }
  if ('errorMessage' in changed) {
    updateErrorMessage();
  }
  if ('filter' in changed) {
    const filterInput = document.querySelector('#filterInput');
    if (filterInput && document.activeElement !== filterInput) {
      (filterInput as unknown as HTMLInputElement).value = controller.state.filter;
    }
  }
}

function injectPopovers(): void {
  const app = document.querySelector('#app');
  if (!app) return;
  app.insertAdjacentHTML(
    'beforebegin',
    `<ui5-popover id="metricsPopover" header-text="Metrics" placement="Bottom">
      <div id="metricsPopoverContent" style="padding: 0.5rem;"></div>
    </ui5-popover>
    <ui5-popover id="logDetailsPopover" header-text="Log Details" placement="Bottom" style="max-width: 600px;">
      <div id="logDetailsPopoverContent" style="padding: 0.5rem;"></div>
      <div slot="footer" style="display: flex; justify-content: flex-end; padding: 0.5rem;">
        <ui5-button id="logDetailsClose" design="Transparent">Close</ui5-button>
      </div>
    </ui5-popover>
    <ui5-popover id="columnFilterPopover" placement="Bottom">
      <div id="columnFilterPopoverContent" style="padding: 0.5rem; min-width: 180px;"></div>
      <div slot="footer" style="display: flex; justify-content: flex-end; padding: 0.5rem;">
        <ui5-button id="columnFilterApply">Filter</ui5-button>
      </div>
    </ui5-popover>`
  );
}

document.addEventListener('DOMContentLoaded', () => {
  injectPopovers();
  controller.connect(update);
  renderApp();
});
