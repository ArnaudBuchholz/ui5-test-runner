import type { LogEntry } from '../types.js';
import { levelToString } from '../apiClient.js';
import { formatTimestamp } from '../timeRange.js';
import type { FilterField } from '../filterHelpers.js';

interface CellClickDetail {
  field: FilterField;
  value: string | number;
}

const LEVEL_COLORS: Record<string, string> = {
  debug: 'Neutral',
  info: 'Set4',
  warn: 'Set3',
  error: 'Negative',
  fatal: 'Negative'
};

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function levelTag(level: number): string {
  const name = levelToString(level);
  const color = LEVEL_COLORS[name] ?? 'Neutral';
  return `<ui5-tag color-scheme="${color}">${name}</ui5-tag>`;
}

export function renderLogTable(entries: LogEntry[], selectedIndex: number | null): string {
  const rows = entries
    .map((entry, index) => {
      const selected = index === selectedIndex ? ' class="log-row log-row--selected"' : ' class="log-row"';
      const ts = formatTimestamp(entry.timestamp);
      const level = levelTag(entry.level);
      return `<tr${selected} data-index="${index}">
        <td class="log-cell log-cell--num">${index + 1}</td>
        <td class="log-cell log-cell--ts" data-field="timestamp">${escapeHtml(ts)}</td>
        <td class="log-cell log-cell--level" data-field="level" data-value="${entry.level}">${level}</td>
        <td class="log-cell log-cell--source" data-field="source" data-value="${escapeHtml(entry.source)}">${escapeHtml(entry.source)}</td>
        <td class="log-cell log-cell--pid" data-field="processId" data-value="${entry.processId}">${entry.processId}</td>
        <td class="log-cell log-cell--tid" data-field="threadId" data-value="${entry.threadId}">${entry.threadId}</td>
        <td class="log-cell log-cell--msg" data-field="message" data-value="${escapeHtml(entry.message)}">${escapeHtml(entry.message)}</td>
      </tr>`;
    })
    .join('');

  return `
    <div class="log-table-wrapper">
      <table class="log-table" id="logTable">
        <thead>
          <tr class="log-header-row">
            <th class="log-cell log-cell--num">#</th>
            <th class="log-cell log-cell--ts">timestamp (local)</th>
            <th class="log-cell log-cell--level">level</th>
            <th class="log-cell log-cell--source">source</th>
            <th class="log-cell log-cell--pid">processId</th>
            <th class="log-cell log-cell--tid">threadId</th>
            <th class="log-cell log-cell--msg">message</th>
          </tr>
        </thead>
        <tbody id="logTableBody">
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

export function parseCellClick(target: HTMLElement): CellClickDetail | null {
  const cell = target.closest<HTMLElement>('td[data-field]');
  if (!cell) return null;
  const field = cell.dataset.field as FilterField;
  if (field === 'timestamp' || !field) return null;
  const raw = cell.dataset.value ?? '';
  const numberFields: FilterField[] = ['processId', 'threadId'];
  const value: string | number = numberFields.includes(field) ? Number(raw) : raw;
  return { field, value };
}
