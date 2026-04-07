import '@ui5/webcomponents/dist/Input.js';
import '@ui5/webcomponents/dist/Select.js';
import '@ui5/webcomponents/dist/Option.js';
import '@ui5/webcomponents/dist/DateTimePicker.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/MessageStrip.js';
import '@ui5/webcomponents/dist/Popover.js';

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

function ensurePopovers(): void {
  if (!document.querySelector('#metricsPopover')) {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<ui5-popover id="metricsPopover" header-text="Metrics" placement="Bottom">
        <div id="metricsPopoverContent" style="padding:0.5rem;"></div>
      </ui5-popover>
      <ui5-popover id="logDetailsPopover" header-text="Log Details" placement="Bottom" style="max-width:600px;">
        <div id="logDetailsPopoverContent" style="padding:0.5rem;"></div>
        <div slot="footer" style="display:flex;justify-content:flex-end;padding:0.5rem;">
          <ui5-button id="logDetailsClose" design="Transparent">Close</ui5-button>
        </div>
      </ui5-popover>`
    );
  }
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
  statusButton.textContent = isLive ? 'Live' : 'Replay';
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

document.addEventListener('DOMContentLoaded', () => {
  ensurePopovers();
  controller.connect(update);
  renderApp();
});
