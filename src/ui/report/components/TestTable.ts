import type { State, TestAndBreadcrumbs } from '../../../reports/ui/types.js';
import type { CommonTestStatus } from '../../../types/CommonTestReportFormat.js';
import { BREADCRUMBS } from '../../../reports/ui/types.js';
import { formatDuration } from '../utils/format.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { renderTestDetails } from './TestDetails.js';

/** Collapsed row height in pixels — must match `.row__head` box in style.css. */
export const ROW_HEIGHT = 33;
/** Extra rows rendered above/below the viewport to avoid blank edges while scrolling. */
const OVERSCAN = 6;

const STATUS_ICON: Record<CommonTestStatus, string> = {
  passed: '✓',
  failed: '✗',
  skipped: '○',
  pending: '◔',
  other: '?'
};

function statusCell(status: CommonTestStatus): string {
  const known = status in STATUS_ICON ? status : 'other';
  const icon = STATUS_ICON[status] ?? '?';
  return `<span class="status status--${known}"><span class="status__icon">${icon}</span>${escapeHtml(status)}</span>`;
}

function suiteCrumb(test: TestAndBreadcrumbs): string {
  const crumbs = test[BREADCRUMBS];
  if (crumbs.length === 0) {
    return '';
  }
  const label = crumbs.map((suite) => suite.label).join(' › ');
  return escapeHtml(label);
}

export function renderThead(): string {
  return `<div class="thead">
  <span class="th th--status">Status</span>
  <span class="th th--name">Test</span>
  <span class="th th--suite">Suite</span>
  <span class="th th--dur">Duration</span>
</div>`;
}

function renderRowHead(test: TestAndBreadcrumbs, index: number): string {
  return `<div class="row__head" data-index="${index}">
  <span class="row__cell row__cell--status">${statusCell(test.status)}</span>
  <span class="row__cell row__cell--name" title="${escapeHtml(test.name)}">${escapeHtml(test.name)}</span>
  <span class="row__cell row__cell--suite" title="${escapeHtml(suiteCrumb(test))}">${suiteCrumb(test)}</span>
  <span class="row__cell row__cell--dur">${formatDuration(test.duration)}</span>
</div>`;
}

/**
Render only the rows intersecting the viewport (plus overscan), absolutely
positioned inside a full-height sizer. Expanded rows are measured so the sizer and
offsets stay correct regardless of detail height.

@param state controller state (uses `state.tests`)
@param expanded set of expanded row indices
@param heights measured heights per expanded index (collapsed rows use ROW_HEIGHT)
@param scrollTop current scroll offset of the `.table` container
@param viewport visible height of the `.table` container
*/
export function renderTableWindow(
  state: State,
  expanded: Set<number>,
  heights: Map<number, number>,
  scrollTop: number,
  viewport: number
): string {
  const tests = state.tests;
  if (tests.length === 0) {
    return `<div class="table__sizer"><div class="empty">No tests match the current filters.</div></div>`;
  }

  // Prefix offsets: offsets[i] is the top y of row i; offsets[n] is total height.
  const offsets = new Float64Array(tests.length + 1);
  for (let index = 0; index < tests.length; ++index) {
    const height = expanded.has(index) ? (heights.get(index) ?? ROW_HEIGHT) : ROW_HEIGHT;
    offsets[index + 1] = offsets[index]! + height;
  }
  const totalHeight = offsets[tests.length]!;

  // Find first visible row via linear scan from an estimate (cheap; rows are mostly uniform).
  const top = Math.max(0, scrollTop);
  const bottom = scrollTop + viewport;
  let start = Math.max(0, Math.min(tests.length - 1, Math.floor(top / ROW_HEIGHT) - OVERSCAN));
  while (start > 0 && offsets[start]! > top) {
    --start;
  }
  while (start < tests.length - 1 && offsets[start + 1]! <= top) {
    ++start;
  }
  start = Math.max(0, start - OVERSCAN);

  let end = start;
  while (end < tests.length && offsets[end]! < bottom) {
    ++end;
  }
  end = Math.min(tests.length, end + OVERSCAN);

  const windowTop = offsets[start]!;
  let rows = '';
  for (let index = start; index < end; ++index) {
    const test = tests[index]!;
    const details = expanded.has(index) ? renderTestDetails(test, index) : '';
    rows += `<div class="row" data-index="${index}">${renderRowHead(test, index)}${details}</div>`;
  }

  return `<div class="table__sizer" style="height:${totalHeight}px">
  <div class="table__window" style="top:${windowTop}px" data-start="${start}">${rows}</div>
</div>`;
}
