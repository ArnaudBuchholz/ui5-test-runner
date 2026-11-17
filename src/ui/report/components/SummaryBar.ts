import type { State } from '../../../reports/ui/types.js';

export function renderSummaryBar(state: State): string {
  type Segment = {
    key: 'pass' | 'fail' | 'skip' | 'other';
    countClass: string;
    icon: string;
    label: string;
    count: number;
  };
  const { summary } = state.report.results;
  const other = summary.pending + summary.other;

  const segments: Segment[] = [
    { key: 'pass', countClass: 'count--pass', icon: '✓', label: 'passed', count: summary.passed },
    { key: 'fail', countClass: 'count--fail', icon: '✗', label: 'failed', count: summary.failed },
    { key: 'skip', countClass: 'count--skip', icon: '○', label: 'skipped', count: summary.skipped },
    { key: 'other', countClass: 'count--other', icon: '?', label: 'other', count: other }
  ];

  const counts = segments
    .map(
      (segment) =>
        `<span class="count ${segment.countClass}"><span class="count__icon">${segment.icon}</span>` +
        `<span class="count__n">${segment.count}</span> ${segment.label}</span>`
    )
    .join('');

  const bar = segments
    .filter((segment) => segment.count > 0)
    // Non-zero segments get a small floor so a handful of failures stays visible
    // against tens of thousands of passes — the thing people scan for is never hidden.
    .map(
      (segment) =>
        `<span class="propbar__seg propbar__seg--${segment.key}" style="min-width:3px;flex:${segment.count} 0 auto" ` +
        `title="${segment.count} ${segment.label}"></span>`
    )
    .join('');

  return `<section class="summary">
  <div class="summary__counts"><span class="count"><span class="count__n">${summary.tests}</span> total</span>${counts}</div>
  <div class="propbar" role="img" aria-label="${summary.passed} passed, ${summary.failed} failed, ${summary.skipped} skipped, ${other} other">${bar}</div>
</section>`;
}
