import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import { levelName, formatClock } from '../utils/format.js';
import { escapeHtml, renderEventDetails } from './EventDetails.js';

/** Short source glyph shown in the gutter — purely visual, colour carries the level. */
function sourceGlyph(source: string): string {
  if (source === 'assert') return '✦';
  if (source.startsWith('http')) return '↔';
  if (source === 'metric') return '▦';
  if (source === 'progress') return '▸';
  if (source.startsWith('browser')) return '◉';
  if (source.startsWith('process')) return '⚙';
  if (source === 'page') return '▭';
  return '•';
}

function badge(label: string, value: number | undefined, kind: string): string {
  return value === undefined ? '' : `<span class="ev-badge ev-badge-${kind}">${label}${value}</span>`;
}

function renderRow(log: InternalLogAttributes, index: number, isExpanded: boolean): string {
  const level = levelName(log.level);
  const pageClass = typeof log.pageId === 'number' ? ` ev-page-${log.pageId % 8}` : '';
  const expandedClass = isExpanded ? ' ev-row-expanded' : '';
  const detail = isExpanded ? `<div class="ev-row-detail">${renderEventDetails(log)}</div>` : '';
  return `<div class="ev-row ev-level-${level}${pageClass}${expandedClass}" data-index="${index}">
    <span class="ev-time">${escapeHtml(formatClock(log.timestamp))}</span>
    <span class="ev-glyph" title="${escapeHtml(log.source)}">${sourceGlyph(log.source)}</span>
    <span class="ev-source">${escapeHtml(log.source)}</span>
    <span class="ev-message">${escapeHtml(log.message)}</span>
    <span class="ev-badges">${badge('p', log.processId, 'proc')}${badge('pg', log.pageId, 'page')}</span>
  </div>${detail}`;
}

/**
Render the whole event stream. `order` controls chronological direction; `expandedIndex`
(into the original `logs` array) renders that row's detail inline. Returns an empty-state
message when there is nothing to show.
*/
export function renderEventStream(
  logs: ReadonlyArray<InternalLogAttributes>,
  { order, expandedIndex }: { order: 'asc' | 'desc'; expandedIndex: number }
): string {
  if (logs.length === 0) {
    return `<div class="ev-empty">No events match the current filter.</div>`;
  }
  const indices = logs.map((_, index) => index);
  if (order === 'desc') {
    indices.reverse();
  }
  return indices.map((index) => renderRow(logs[index]!, index, index === expandedIndex)).join('');
}
