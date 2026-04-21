import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import { levelIcon, formatTimestamp } from '../utils/format.js';

const MAX_MESSAGE_LENGTH = 200;

export function renderLogTable(logs: InternalLogAttributes[]): string {
  const thead = `<thead><tr>
  <th data-col="timestamp" class="col-clickable">Timestamp (local)</th>
  <th data-col="level" class="col-clickable">Level</th>
  <th data-col="source" class="col-clickable">Source</th>
  <th data-col="processId" class="col-clickable">PID</th>
  <th data-col="threadId" class="col-clickable">TID</th>
  <th class="col-message">Message</th>
</tr></thead>`;

  if (logs.length === 0) {
    return `${thead}<tbody><tr><td colspan="6" style="text-align:center;padding:1rem;color:var(--sapContent_LabelColor);">No log entries</td></tr></tbody>`;
  }

  const rows = logs
    .map((log, index) => {
      const message =
        log.message.length > MAX_MESSAGE_LENGTH ? `${log.message.slice(0, MAX_MESSAGE_LENGTH)}…` : log.message;
      return `<tr data-index="${index}">
  <td>${formatTimestamp(log.timestamp)}</td>
  <td>${levelIcon(log.level)}</td>
  <td>${log.source}</td>
  <td>${log.processId}</td>
  <td>${log.threadId}</td>
  <td class="col-message">${escapeHtml(message)}</td>
</tr>`;
    })
    .join('');

  return `${thead}<tbody>${rows}</tbody>`;
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
