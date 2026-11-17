import type { TestAndBreadcrumbs } from '../../../reports/ui/types.js';
import { formatDuration } from '../utils/format.js';
import { escapeHtml } from '../utils/escapeHtml.js';

type Attachment = { name: string; contentType: string; path: string };

type QUnitLog = {
  result?: boolean;
  message?: string;
  actual?: unknown;
  expected?: unknown;
};

function drow(label: string, valueHtml: string): string {
  return `<div class="drow"><span class="drow__label">${label}</span><span class="drow__value">${valueHtml}</span></div>`;
}

function renderAssertions(logs: QUnitLog[], index: number): string {
  const rows = logs
    .map((log) => {
      const isPass = log.result === true;
      const icon = isPass ? '✓' : '✗';
      const iconClass = isPass ? 'assert__icon--pass' : 'assert__icon--fail';
      const message = log.message === undefined ? '—' : escapeHtml(log.message);
      let values = '';
      if (!isPass && (log.actual !== undefined || log.expected !== undefined)) {
        const parts: string[] = [];
        if (log.actual !== undefined) {
          parts.push(`actual <code class="code">${escapeHtml(String(log.actual))}</code>`);
        }
        if (log.expected !== undefined) {
          parts.push(`expected <code class="code">${escapeHtml(String(log.expected))}</code>`);
        }
        values = ` <span class="assert__values">${parts.join(' · ')}</span>`;
      }
      return `<div class="assert"><span class="${iconClass}">${icon}</span> ${message}${values}</div>`;
    })
    .join('');

  return `<div class="assertions">
  <button class="assert-toggle" data-assert-index="${index}">▸ Assertions (${logs.length})</button>
  <div class="assert-body" data-assert-index="${index}" style="display:none">${rows}</div>
</div>`;
}

function renderAttachments(attachments: Attachment[]): string {
  const items = attachments
    .map((attachment) =>
      attachment.contentType.startsWith('image/')
        ? `<div class="att">
  <img class="att__thumb" data-src="${escapeHtml(attachment.path)}" alt="${escapeHtml(attachment.name)}" title="${escapeHtml(attachment.path)}" />
  <span class="att__cap">${escapeHtml(attachment.name)}</span>
</div>`
        : `<div class="att"><a href="${escapeHtml(attachment.path)}" target="_blank" rel="noreferrer">${escapeHtml(attachment.name)}</a></div>`
    )
    .join('');
  return `<div class="attachments">${items}</div>`;
}

export function renderTestDetails(test: TestAndBreadcrumbs, index: number): string {
  const rows: string[] = [drow('Duration', formatDuration(test.duration))];

  if (test.message) {
    rows.push(drow('Message', escapeHtml(test.message)));
  }

  const extra = test.extra as { actual?: unknown; expected?: unknown; QUnitLogs?: QUnitLog[] } | undefined;
  if (extra && (extra.actual !== undefined || extra.expected !== undefined)) {
    const parts: string[] = [];
    if (extra.actual !== undefined) {
      parts.push(
        `<span class="diff__actual">actual <code class="code">${escapeHtml(String(extra.actual))}</code></span>`
      );
    }
    if (extra.expected !== undefined) {
      parts.push(
        `<span class="diff__expected">expected <code class="code">${escapeHtml(String(extra.expected))}</code></span>`
      );
    }
    rows.push(drow('Diff', `<div class="diff">${parts.join('')}</div>`));
  }

  if (test.trace) {
    rows.push(drow('Stack', `<pre class="trace">${escapeHtml(test.trace)}</pre>`));
  }

  if (extra?.QUnitLogs && extra.QUnitLogs.length > 0) {
    rows.push(drow('Assertions', renderAssertions(extra.QUnitLogs, index)));
  }

  if (test.screenshot) {
    rows.push(
      drow(
        'Screenshot',
        `<div class="attachments"><div class="att"><img class="att__thumb" data-src="${escapeHtml(test.screenshot)}" alt="screenshot" title="${escapeHtml(test.screenshot)}" /></div></div>`
      )
    );
  }

  if (test.attachments && test.attachments.length > 0) {
    rows.push(drow('Attachments', renderAttachments(test.attachments)));
  }

  return `<div class="details">${rows.join('')}</div>`;
}
