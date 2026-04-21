import type { InternalLogAttributes, LogErrorAttributes } from '../../../platform/logger/types.js';
import { levelIcon, levelName, formatTimestamp } from '../utils/format.js';

function filterButtons(field: string, value: unknown): string {
  const jsonValue = JSON.stringify(value);
  return `<span class="log-details-actions">
    <ui5-button class="filter-add-btn" design="Transparent" data-field="${field}" data-value='${jsonValue}' data-op="===">&#10133;</ui5-button>
    <ui5-button class="filter-remove-btn" design="Transparent" data-field="${field}" data-value='${jsonValue}' data-op="!==">&#10134;</ui5-button>
  </span>`;
}

function detailRow(label: string, value: string, buttons = ''): string {
  return `<div class="log-details-row">
  <span class="log-details-label">${label}</span>
  <span class="log-details-value">${value}</span>
  ${buttons}
</div>`;
}

function renderDataFields(data: object, prefix = 'data'): string {
  return Object.entries(data)
    .map(([key, value]) => {
      const field = `${prefix}.${key}`;
      if (Array.isArray(value)) {
        return value
          .map((item, index) => {
            const itemField = `${field}[${index}]`;
            if (typeof item === 'object' && item !== null) {
              return renderDataFields(item as object, itemField);
            }
            return detailRow(itemField, escapeHtml(String(item)), filterButtons(itemField, item));
          })
          .join('');
      }
      if (typeof value === 'object' && value !== null) {
        return renderDataFields(value as object, field);
      }
      return detailRow(field, escapeHtml(String(value)), filterButtons(field, value));
    })
    .join('');
}

function renderError(error: LogErrorAttributes): string {
  return `<div class="log-details-row"><span class="log-details-section-label">error (JSON):</span></div>
<div class="log-details-row"><pre class="log-details-error">${escapeHtml(JSON.stringify(error, null, 2))}</pre></div>`;
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function renderLogDetails(log: InternalLogAttributes): string {
  const icon = levelIcon(log.level);
  const name = levelName(log.level);

  let html = detailRow('timestamp', formatTimestamp(log.timestamp));
  html += detailRow('level', `${icon} ${name}`, filterButtons('level', name));
  html += detailRow('source', escapeHtml(log.source), filterButtons('source', log.source));
  html += detailRow('processId', String(log.processId), filterButtons('processId', log.processId));
  html += detailRow('threadId', String(log.threadId), filterButtons('threadId', log.threadId));
  html += detailRow('message', escapeHtml(log.message));

  if (log.error !== undefined) {
    html += renderError(log.error as LogErrorAttributes);
  }

  if (log.data !== undefined) {
    html += `<div class="log-details-row"><span class="log-details-section-label">data (JSON):</span></div>`;
    html += renderDataFields(log.data as Record<string, unknown>);
  }

  return html;
}
