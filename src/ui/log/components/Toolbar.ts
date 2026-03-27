import type { State, AutoRefreshInterval, RelativePreset } from '../types.js';
import { RELATIVE_PRESETS, getPresetLabel, formatDatetimeLocal } from '../timeRange.js';

const AUTO_REFRESH_INTERVALS: AutoRefreshInterval[] = [5, 10, 30, 60];

function renderTimeRangeSection(state: State): string {
  const { timeRange } = state;
  const modeRelative = timeRange.mode === 'relative';

  const presetOptions = RELATIVE_PRESETS.map(
    (p: RelativePreset) =>
      `<ui5-option value="${p}" ${modeRelative && timeRange.preset === p ? 'selected' : ''}>${getPresetLabel(p)}</ui5-option>`
  ).join('');

  const absoluteFrom = modeRelative ? '' : formatDatetimeLocal(timeRange.from);
  const absoluteTo = modeRelative ? '' : formatDatetimeLocal(timeRange.to);

  return `
    <div class="toolbar-section">
      <ui5-label class="toolbar-label">Time Range</ui5-label>
      <div class="toolbar-row">
        <ui5-select id="timeRangeMode">
          <ui5-option value="relative" ${modeRelative ? 'selected' : ''}>Relative</ui5-option>
          <ui5-option value="absolute" ${modeRelative ? '' : 'selected'}>Absolute</ui5-option>
        </ui5-select>
        ${
          modeRelative
            ? `<ui5-select id="relativePreset">${presetOptions}</ui5-select>`
            : `<input type="datetime-local" id="absoluteFrom" class="datetime-input" value="${absoluteFrom}" />
               <span class="toolbar-separator">to</span>
               <input type="datetime-local" id="absoluteTo" class="datetime-input" value="${absoluteTo}" />`
        }
      </div>
    </div>
  `;
}

function renderRefreshSection(state: State): string {
  const { autoRefresh, autoRefreshInterval, lastRefresh } = state;
  const lastRefreshText = lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : '—';

  const intervalOptions = AUTO_REFRESH_INTERVALS.map(
    (index) => `<ui5-option value="${index}" ${autoRefreshInterval === index ? 'selected' : ''}>${index}s</ui5-option>`
  ).join('');

  return `
    <div class="toolbar-section">
      <ui5-label class="toolbar-label">Refresh</ui5-label>
      <div class="toolbar-row">
        <ui5-button id="refreshNowBtn" design="Default">Refresh Now</ui5-button>
        <ui5-toggle-button id="autoRefreshBtn" ${autoRefresh ? 'pressed' : ''}>Auto refresh</ui5-toggle-button>
        <ui5-select id="autoRefreshInterval">${intervalOptions}</ui5-select>
        <span class="toolbar-last-refresh">Last refresh: ${lastRefreshText}</span>
      </div>
    </div>
  `;
}

function renderFilterSection(state: State): string {
  const { filterExpression, searchText, filterError } = state;
  return `
    <div class="toolbar-section">
      <ui5-label class="toolbar-label">Filter &amp; Search</ui5-label>
      <div class="toolbar-row">
        <ui5-input id="filterExpressionInput" class="filter-expression-input"
          value="${filterExpression.replaceAll('"', '&quot;')}"
          placeholder='e.g. level === "error" &amp;&amp; source === "job"'></ui5-input>
        <ui5-button id="applyFilterBtn" design="Emphasized">Apply</ui5-button>
      </div>
      <div class="toolbar-row">
        <ui5-input id="searchInput" class="search-input"
          value="${searchText.replaceAll('"', '&quot;')}"
          placeholder="Search in message or source..."></ui5-input>
      </div>
      ${filterError ? `<ui5-message-strip design="Negative" hide-close-button id="filterError">${filterError}</ui5-message-strip>` : ''}
    </div>
  `;
}

export function renderToolbar(state: State): string {
  const { isLive, entries } = state;
  const statusDesign = isLive ? 'Positive' : 'Neutral';
  const statusText = isLive ? 'Live' : 'Idle';
  const count = entries.length;

  return `
    <div class="toolbar">
      <div class="toolbar-header">
        <ui5-title level="H4" class="toolbar-title">UI5 Test Runner Log Viewer</ui5-title>
        <ui5-tag color-scheme="${statusDesign}">Status: ${statusText}</ui5-tag>
      </div>
      ${renderTimeRangeSection(state)}
      ${renderRefreshSection(state)}
      ${renderFilterSection(state)}
      <div class="toolbar-results-count">Results: <strong>${count}</strong> rows (max 1000 per refresh, ascending timestamp)</div>
    </div>
  `;
}
