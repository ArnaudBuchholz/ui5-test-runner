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
  if (test.breadcrumbs.length === 0) return '';
  const items = test.breadcrumbs
    .map(
      (suite) =>
        `<ui5-breadcrumbs-item data-suite-uid="${encodeURIComponent(suite.uid)}">${escapeHtml(suite.label)}</ui5-breadcrumbs-item>`
    )
    .join('');
  return `<ui5-breadcrumbs>${items}</ui5-breadcrumbs>`;
}

function renderTestDetails(test: TestAndBreadcrumbs): string {
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
  const limited = tests.length > 1000;
  const displayedTests = limited ? tests.slice(0, 1000) : tests;

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

  const warning = limited
    ? `<div class="test-list-warning"><ui5-message-strip design="Warning" hide-close-button>More than 1000 tests match the current filters. Only the first 1000 are displayed. Use the filters above to narrow down the results.</ui5-message-strip></div>`
    : '';

  const testRows = displayedTests
    .map((test, index) => {
      const breadcrumbs = renderBreadcrumbs(test);
      const details = renderTestDetails(test);
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
