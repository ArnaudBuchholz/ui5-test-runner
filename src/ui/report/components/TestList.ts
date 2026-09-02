import { BREADCRUMBS } from '../../../reports/ui/types.js';
import type { State, Settings, TestAndBreadcrumbs } from '../../../reports/ui/types.js';
import { formatDuration } from '../utils/format.js';

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function statusTag(status: string): string {
  if (status === 'passed') return `<ui5-tag design="Positive">passed</ui5-tag>`;
  if (status === 'failed') return `<ui5-tag design="Negative">failed</ui5-tag>`;
  if (status === 'skipped') return `<ui5-tag design="Neutral">skipped</ui5-tag>`;
  return `<ui5-tag design="None">${escapeHtml(status)}</ui5-tag>`;
}

function renderBreadcrumbs(test: TestAndBreadcrumbs): string {
  if (test[BREADCRUMBS].length === 0) return '';
  const items = test[BREADCRUMBS].map(
    (suite) =>
      `<ui5-breadcrumbs-item data-suite-uid="${encodeURIComponent(suite.uid)}">${escapeHtml(suite.label)}</ui5-breadcrumbs-item>`
  ).join('');
  return `<ui5-breadcrumbs>${items}</ui5-breadcrumbs>`;
}

function renderQUnitLogs(logs: unknown[]): string {
  const rows = logs
    .map((entry) => {
      const log = entry as { result?: boolean; message?: string; actual?: unknown; expected?: unknown };
      const icon = log.result ? '✓' : '✗';
      const iconClass = log.result ? 'qunit-log-pass' : 'qunit-log-fail';
      // eslint-disable-next-line unicorn/no-useless-coercion
      const message = log.message === undefined ? '—' : escapeHtml(String(log.message));
      let extra = '';
      if (!log.result && (log.actual !== undefined || log.expected !== undefined)) {
        extra = ` <span class="qunit-log-values">[`;
        if (log.actual !== undefined) {
          extra += `actual: <code>${escapeHtml(String(log.actual))}</code> `;
        }
        if (log.expected !== undefined) {
          extra += `expected: <code>${escapeHtml(String(log.expected))}</code>`;
        }
        extra += `]</span>`;
      }
      return `<div class="qunit-log-row"><span class="${iconClass}">${icon}</span> ${message}${extra}</div>`;
    })
    .join('');
  return rows;
}

function renderAttachments(
  attachments: { name: string; contentType: string; path: string }[],
  rowIndex: number
): string {
  return attachments
    .map((att, index) => {
      if (att.contentType === 'image/png') {
        return `<div class="attachment-item">
  <div class="attachment-caption">${escapeHtml(att.name)}</div>
  <img class="attachment-thumb" data-src="${escapeHtml(att.path)}" data-row="${rowIndex}" data-att="${index}" alt="${escapeHtml(att.name)}" title="${escapeHtml(att.path)}" />
</div>`;
      }
      return `<div class="attachment-item"><a href="${escapeHtml(att.path)}" target="_blank">${escapeHtml(att.name)}</a></div>`;
    })
    .join('');
}

function renderTestDetails(test: TestAndBreadcrumbs, rowIndex: number): string {
  const rows: string[] = [
    `<div class="test-detail-row"><span class="test-detail-label">Duration</span><span>${formatDuration(test.duration)}</span></div>`
  ];
  if (test.message) {
    rows.push(
      `<div class="test-detail-row"><span class="test-detail-label">Message</span><span>${escapeHtml(test.message)}</span></div>`
    );
  }
  if (test.trace) {
    rows.push(
      `<div class="test-detail-row"><span class="test-detail-label">Stack</span><pre class="test-trace">${escapeHtml(test.trace)}</pre></div>`
    );
  }
  if (test.status === 'failed' && test.extra) {
    const { actual, expected } = test.extra as { actual?: unknown; expected?: unknown };
    if (actual !== undefined) {
      rows.push(
        `<div class="test-detail-row"><span class="test-detail-label">Actual</span><code class="test-value">${escapeHtml(String(actual))}</code></div>`
      );
    }
    if (expected !== undefined) {
      rows.push(
        `<div class="test-detail-row"><span class="test-detail-label">Expected</span><code class="test-value">${escapeHtml(String(expected))}</code></div>`
      );
    }
    const qunitLogs = (test.extra as { QUnitLogs?: unknown[] }).QUnitLogs;
    if (qunitLogs && qunitLogs.length > 0) {
      rows.push(`<div class="test-detail-row test-detail-row--block">
  <span class="test-detail-label">Assertions</span>
  <div class="qunit-logs-collapsible">
    <button class="qunit-logs-toggle" data-row="${rowIndex}">[&gt;] Assertions (${qunitLogs.length})</button>
    <div class="qunit-logs-body" style="display:none">${renderQUnitLogs(qunitLogs)}</div>
  </div>
</div>`);
    }
  }
  if (test.screenshot) {
    rows.push(`<div class="test-detail-row">
  <span class="test-detail-label">Screenshot</span>
  <img class="attachment-thumb" data-src="${escapeHtml(test.screenshot)}" data-row="${rowIndex}" data-att="screenshot" alt="failure screenshot" title="${escapeHtml(test.screenshot)}" />
</div>`);
  }
  if (test.attachments && test.attachments.length > 0) {
    rows.push(`<div class="test-detail-row test-detail-row--block">
  <span class="test-detail-label">Attachments</span>
  <div class="attachments-list">${renderAttachments(test.attachments, rowIndex)}</div>
</div>`);
  }
  return rows.join('');
}

function renderSortButtons(state: State, settings: Settings): string {
  return settings.sortBy
    .map((sortOption) => {
      const isExecutionOrder = sortOption.key === '';
      const isActive = state.sortBy === sortOption.key;
      let label = escapeHtml(sortOption.label);
      if (!isExecutionOrder && isActive) {
        label += state.sortAscending ? ' &#8593;' : ' &#8595;';
      }
      const design = isActive ? 'Emphasized' : 'Default';
      return `<ui5-button class="sort-btn" data-sort-key="${sortOption.key}" design="${design}">${label}</ui5-button>`;
    })
    .join('');
}

export function renderTestListBody(state: State, settings: Settings): string {
  const { tests } = state;
  const isLimited = tests.length > 1000;
  const displayedTests = isLimited ? tests.slice(0, 1000) : tests;

  const passed = tests.filter((t) => t.status === 'passed').length;
  const failed = tests.filter((t) => t.status === 'failed').length;
  const skipped = tests.filter((t) => t.status === 'skipped').length;
  const other = tests.length - passed - failed - skipped;

  const countTags = [
    `<span>${tests.length} tests</span>`,
    `<ui5-tag design="Positive">${passed} passed</ui5-tag>`,
    `<ui5-tag design="Negative">${failed} failed</ui5-tag>`,
    `<ui5-tag design="Neutral">${skipped} skipped</ui5-tag>`,
    ...(other > 0 ? [`<ui5-tag design="None">${other} other</ui5-tag>`] : [])
  ].join('');

  const warning = isLimited
    ? `<div class="test-list-warning"><ui5-message-strip design="Warning" hide-close-button>More than 1000 tests match the current filters. Only the first 1000 are displayed. Use the filters above to narrow down the results.</ui5-message-strip></div>`
    : '';

  const testRows = displayedTests
    .map((test, index) => {
      const breadcrumbs = renderBreadcrumbs(test);
      const details = renderTestDetails(test, index);
      return `<div class="test-row" data-key="${index}">
  <div class="test-row-header" data-index="${index}">
    <ui5-button class="test-toggle-btn" design="Transparent" data-index="${index}">[&gt;]</ui5-button>
    <div class="test-row-meta">
      ${breadcrumbs}
      <span class="test-name">${escapeHtml(test.name)}</span>
    </div>
    <div class="test-row-status">${statusTag(test.status)}</div>
  </div>
  <div class="test-row-details" data-index="${index}" style="display:none">
    ${details}
  </div>
</div>`;
    })
    .join('');

  return `<div class="test-list-header">
  <div class="test-list-tags">${countTags}</div>
</div>
<div id="sortRow" class="sort-row">
  <span>Sort By:</span>
  ${renderSortButtons(state, settings)}
</div>
${warning}
<div id="testRows">${testRows}</div>`;
}

export function renderTestList(state: State, settings: Settings): string {
  return `<div id="testList">${renderTestListBody(state, settings)}</div>`;
}
