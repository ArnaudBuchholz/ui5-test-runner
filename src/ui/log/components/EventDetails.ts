import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import { levelName, formatClock } from '../utils/format.js';

export function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

/** A "filter by this value" affordance; wired up by the host via data-* attributes. */
function filterChip(field: string, value: unknown): string {
  const jsonValue = escapeHtml(JSON.stringify(value) ?? 'null');
  return `<span class="ev-filter-chip">
    <button class="ev-filter-btn" data-field="${escapeHtml(field)}" data-value='${jsonValue}' data-op="===" title="Filter to this value">=</button>
    <button class="ev-filter-btn" data-field="${escapeHtml(field)}" data-value='${jsonValue}' data-op="!==" title="Exclude this value">≠</button>
  </span>`;
}

function kv(label: string, value: string, chip = ''): string {
  return `<div class="ev-kv"><span class="ev-kv-label">${escapeHtml(label)}</span><span class="ev-kv-value">${value}</span>${chip}</div>`;
}

function renderTree(data: unknown, prefix: string): string {
  if (data === null || typeof data !== 'object') {
    return kv(prefix, escapeHtml(String(data)), filterChip(prefix, data));
  }
  return Object.entries(data as Record<string, unknown>)
    .map(([key, value]) => {
      const field = Array.isArray(data) ? `${prefix}[${key}]` : `${prefix}.${key}`;
      return typeof value === 'object' && value !== null
        ? renderTree(value, field)
        : kv(field, escapeHtml(String(value)), filterChip(field, value));
    })
    .join('');
}

function renderError(error: unknown): string {
  const text =
    error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : JSON.stringify(error, null, 2);
  return `<div class="ev-section">error</div><pre class="ev-error">${escapeHtml(text)}</pre>`;
}

/**
Render the expanded detail of one log entry: core fields with filter affordances, the
error (if any) prominently, then the structured `data` payload as a tree. Type-aware
rendering falls out naturally because each source's `data` shape is just walked.
*/
export function renderEventDetails(log: InternalLogAttributes): string {
  const rows = [
    kv('timestamp', escapeHtml(formatClock(log.timestamp))),
    kv('level', escapeHtml(levelName(log.level)), filterChip('level', levelName(log.level))),
    kv('source', escapeHtml(log.source), filterChip('source', log.source)),
    kv('processId', String(log.processId), filterChip('processId', log.processId)),
    kv('threadId', String(log.threadId), filterChip('threadId', log.threadId))
  ];
  if (log.pageId !== undefined) {
    rows.push(kv('pageId', String(log.pageId), filterChip('pageId', log.pageId)));
  }
  rows.push(kv('message', escapeHtml(log.message)));

  let html = `<div class="ev-details">${rows.join('')}`;
  if (log.error !== undefined && log.error !== null) {
    html += renderError(log.error);
  }
  if (log.data !== undefined) {
    html += `<div class="ev-section">data</div>${renderTree(log.data, 'data')}`;
  }
  return html + '</div>';
}
