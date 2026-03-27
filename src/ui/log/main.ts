import '@ui5/webcomponents/dist/Title.js';
import '@ui5/webcomponents/dist/Label.js';
import '@ui5/webcomponents/dist/Panel.js';
import '@ui5/webcomponents/dist/Tag.js';
import '@ui5/webcomponents/dist/Select.js';
import '@ui5/webcomponents/dist/Option.js';
import '@ui5/webcomponents/dist/Input.js';
import '@ui5/webcomponents/dist/Button.js';
import '@ui5/webcomponents/dist/ToggleButton.js';
import '@ui5/webcomponents/dist/MessageStrip.js';

import './style.css';

import { getState, setState, subscribe } from './state.js';
import { queryLogs } from './apiClient.js';
import { resolveTimeRange, parseDatetimeLocal } from './timeRange.js';
import { appendFilter, searchEntries } from './filterHelpers.js';
import { renderToolbar } from './components/Toolbar.js';
import { renderLogTable, parseCellClick } from './components/LogTable.js';
import { renderLogDetails } from './components/LogDetails.js';
import { renderMetricsBar } from './components/MetricsBar.js';
import { buildCellActions, renderCellContextMenu } from './components/CellContextMenu.js';
import { createAutoRefreshController } from './AutoRefresh.js';
import type { AbsoluteTimeRange, RelativePreset, AutoRefreshInterval } from './types.js';

interface UI5SelectEvent extends Event {
  target: EventTarget & {
    selectedOption: { value: string };
  };
}

interface UI5InputEvent extends Event {
  target: EventTarget & { value: string };
}

const autoRefresh = createAutoRefreshController();

function getElement<T extends HTMLElement>(id: string): T | null {
  return document.querySelector<T>(`#${id}`);
}

async function refresh(): Promise<void> {
  const state = getState();
  const { from, to } = resolveTimeRange(state.timeRange);

  setState({ isLive: true });

  try {
    const result = await queryLogs({
      from,
      to,
      filter: state.filterExpression || undefined
    });
    setState({
      entries: result.entries,
      metrics: result.metrics,
      lastRefresh: Date.now(),
      filterError: null,
      isLive: false
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    setState({ filterError: message, isLive: false });
  }
}

function render(): void {
  const state = getState();
  const app = document.querySelector('#app');
  if (!app) return;

  const visible = searchEntries(state.entries, state.searchText);
  const selectedEntry = state.selectedEntryIndex === null ? null : (visible[state.selectedEntryIndex] ?? null);

  app.innerHTML = `
    ${renderToolbar(state)}
    <ui5-panel id="tablePanel" header-text="Results">
      ${renderLogTable(visible, state.selectedEntryIndex)}
    </ui5-panel>
    <ui5-panel id="detailsPanel" header-text="Log Details" collapsed>
      ${renderLogDetails(selectedEntry)}
    </ui5-panel>
    <ui5-panel id="metricsPanel" header-text="Metrics from response headers" collapsed>
      ${renderMetricsBar(state.metrics)}
    </ui5-panel>
    <div id="contextMenuContainer"></div>
  `;

  attachEvents();
}

function showContextMenu(x: number, y: number, menuHtml: string): void {
  const container = document.querySelector('#contextMenuContainer');
  if (!container) return;
  container.innerHTML = menuHtml;
  const menu = container.querySelector<HTMLElement>('#cellContextMenu');
  if (!menu) return;
  menu.style.top = `${y}px`;
  menu.style.left = `${x}px`;
  menu.style.display = 'block';
}

function hideContextMenu(): void {
  const container = document.querySelector('#contextMenuContainer');
  if (container) {
    container.innerHTML = '';
  }
}

function attachEvents(/*visibleEntries: ReturnType<typeof searchEntries>*/): void {
  // Time range mode
  getElement('timeRangeMode')?.addEventListener('change', (event: Event) => {
    const uiSelectEvent = event as UI5SelectEvent;
    const mode = uiSelectEvent.target.selectedOption.value as 'relative' | 'absolute';
    if (mode === 'relative') {
      setState({ timeRange: { mode: 'relative', preset: '15m' } });
    } else {
      const now = Date.now();
      setState({ timeRange: { mode: 'absolute', from: now - 15 * 60 * 1000, to: now } });
    }
  });

  // Relative preset
  getElement('relativePreset')?.addEventListener('change', (event: Event) => {
    const uiSelectEvent = event as UI5SelectEvent;
    setState({ timeRange: { mode: 'relative', preset: uiSelectEvent.target.selectedOption.value as RelativePreset } });
  });

  // Absolute from / to
  getElement('absoluteFrom')?.addEventListener('change', (event: Event) => {
    const target = event.target as HTMLInputElement;
    const state = getState();
    if (state.timeRange.mode === 'absolute') {
      const updated: AbsoluteTimeRange = { ...state.timeRange, from: parseDatetimeLocal(target.value) };
      setState({ timeRange: updated });
    }
  });

  getElement('absoluteTo')?.addEventListener('change', (event: Event) => {
    const target = event.target as HTMLInputElement;
    const state = getState();
    if (state.timeRange.mode === 'absolute') {
      const updated: AbsoluteTimeRange = { ...state.timeRange, to: parseDatetimeLocal(target.value) };
      setState({ timeRange: updated });
    }
  });

  // Refresh now
  getElement('refreshNowBtn')?.addEventListener('click', () => {
    void refresh();
  });

  // Auto refresh toggle
  getElement('autoRefreshBtn')?.addEventListener('click', () => {
    const newAutoRefresh = !getState().autoRefresh;
    setState({ autoRefresh: newAutoRefresh });
    if (newAutoRefresh) {
      autoRefresh.start(getState().autoRefreshInterval, () => {
        void refresh();
      });
    } else {
      autoRefresh.stop();
    }
  });

  // Auto refresh interval
  getElement('autoRefreshInterval')?.addEventListener('change', (event: Event) => {
    const uiSelectEvent = event as UI5SelectEvent;
    const interval = Number(uiSelectEvent.target.selectedOption.value) as AutoRefreshInterval;
    setState({ autoRefreshInterval: interval });
    if (getState().autoRefresh) {
      autoRefresh.start(interval, () => {
        void refresh();
      });
    }
  });

  // Filter expression apply
  getElement('applyFilterBtn')?.addEventListener('click', () => {
    const input = getElement<HTMLElement & { value?: string }>('filterExpressionInput');
    if (input && 'value' in input) {
      setState({ filterExpression: input.value ?? '' });
      void refresh();
    }
  });

  // Filter expression enter key
  getElement('filterExpressionInput')?.addEventListener('keydown', (event: Event) => {
    const ke = event as KeyboardEvent;
    if (ke.key === 'Enter') {
      const target = ke.target as HTMLElement & { value?: string };
      setState({ filterExpression: target.value ?? '' });
      void refresh();
    }
  });

  // Search text
  getElement('searchInput')?.addEventListener('input', (event: Event) => {
    const uiSelectEvent = event as UI5InputEvent;
    setState({ searchText: uiSelectEvent.target.value, selectedEntryIndex: null });
  });

  // Table row click (select row)
  document.querySelector('#logTableBody')?.addEventListener('click', (event: Event) => {
    const target = event.target as HTMLElement;

    // Handle cell right-click-style helper (left click with cell data)
    const cellDetail = parseCellClick(target);
    if (cellDetail) {
      const actions = buildCellActions(cellDetail.field, cellDetail.value);
      const menuHtml = renderCellContextMenu(actions);
      const me = event as MouseEvent;
      showContextMenu(me.pageX, me.pageY, menuHtml);

      // Attach context menu item click
      setTimeout(() => {
        const container = document.querySelector('#contextMenuContainer');
        for (const item of container?.querySelectorAll('.context-menu__item') ?? []) {
          item.addEventListener('click', () => {
            const expression = (item as HTMLElement).dataset['expression'] ?? '';
            const current = getState().filterExpression;
            const newFilter = appendFilter(current, expression);
            setState({ filterExpression: newFilter });
            hideContextMenu();
            void refresh();
          });
        }
      }, 0);
    }

    const row = target.closest<HTMLElement>('tr[data-index]');
    if (row) {
      const index = Number(row.dataset['index']);
      setState({ selectedEntryIndex: index });
      // Expand details panel
      const detailsPanel = document.querySelector('#detailsPanel');
      if (detailsPanel) {
        (detailsPanel as unknown as Record<string, unknown>)['collapsed'] = false;
      }
    }
  });

  // Close context menu on outside click
  document.addEventListener(
    'click',
    (event: Event) => {
      const container = document.querySelector('#contextMenuContainer');
      if (container && !container.contains(event.target as Node)) {
        hideContextMenu();
      }
    },
    { capture: true }
  );
}

subscribe(render);
void refresh();
