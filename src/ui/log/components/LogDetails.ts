import type { LogEntry } from '../types.js';
import { levelToString } from '../apiClient.js';
import { formatTimestamp } from '../timeRange.js';

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function renderLogDetails(entry: LogEntry | null): string {
  if (!entry) {
    return `<div class="log-details log-details--empty"><ui5-label>Select a row to view details</ui5-label></div>`;
  }

  const levelName = levelToString(entry.level);
  const ts = formatTimestamp(entry.timestamp);
  const dataJson = entry.data ? JSON.stringify(entry.data, null, 2) : null;

  return `
    <div class="log-details">
      <div class="log-details__row">
        <span class="log-details__field">timestamp:</span>
        <span class="log-details__value">${escapeHtml(ts)}</span>
      </div>
      <div class="log-details__row">
        <span class="log-details__field">level:</span>
        <span class="log-details__value">${escapeHtml(levelName)}</span>
        <span class="log-details__field log-details__field--gap">source:</span>
        <span class="log-details__value">${escapeHtml(entry.source)}</span>
        <span class="log-details__field log-details__field--gap">processId:</span>
        <span class="log-details__value">${entry.processId}</span>
        <span class="log-details__field log-details__field--gap">threadId:</span>
        <span class="log-details__value">${entry.threadId}</span>
        <span class="log-details__field log-details__field--gap">isMainThread:</span>
        <span class="log-details__value">${String(entry.isMainThread)}</span>
      </div>
      <div class="log-details__row">
        <span class="log-details__field">message:</span>
        <span class="log-details__value">${escapeHtml(entry.message)}</span>
      </div>
      ${
        dataJson
          ? `<div class="log-details__row log-details__row--data">
        <span class="log-details__field">data (JSON):</span>
        <pre class="log-details__json">${escapeHtml(dataJson)}</pre>
      </div>`
          : ''
      }
    </div>
  `;
}
