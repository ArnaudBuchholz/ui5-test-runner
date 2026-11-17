import type { State, Suite } from '../../../reports/ui/types.js';
import type { CTRFTest } from '../../../types/CommonTestReportFormat.js';
import { SUITE_SEPARATOR, NO_SUITE_ID } from '../../../reports/ui/suites.js';
import { escapeHtml } from '../utils/escapeHtml.js';

type Counts = { total: number; failed: number };

/**
Aggregate total / failed test counts per suite uid. A test belongs to every suite
whose uid is a prefix of the test's suite path (so a parent suite counts all its
descendants), matching how the controller filters on `filterOnSuiteUid`.
*/
function countBySuite(tests: CTRFTest[]): Map<string, Counts> {
  const counts = new Map<string, Counts>();
  const bump = (uid: string, isFailed: boolean): void => {
    const entry = counts.get(uid) ?? { total: 0, failed: 0 };
    entry.total += 1;
    if (isFailed) {
      entry.failed += 1;
    }
    counts.set(uid, entry);
  };

  for (const test of tests) {
    const isFailed = test.status === 'failed';
    const path = test.suite ?? [];
    if (path.length === 0) {
      bump(NO_SUITE_ID, isFailed);
      continue;
    }
    const segments: string[] = [];
    for (const segment of path) {
      segments.push(segment);
      bump(segments.join(SUITE_SEPARATOR), isFailed);
    }
  }
  return counts;
}

function renderNode(suite: Suite, counts: Map<string, Counts>, activeUid: string, depth: number): string {
  const entry = counts.get(suite.uid) ?? { total: 0, failed: 0 };
  const hasChildren = suite.suites.length > 0;
  const isActive = suite.uid === activeUid;
  const twisty = hasChildren ? '▾' : '';
  const twistyClass = hasChildren ? 'tnode__twisty' : 'tnode__twisty tnode__twisty--leaf';
  const failBadge = entry.failed > 0 ? `<span class="tnode__fail">✗${entry.failed}</span>` : '';

  const self = `<div class="tnode${isActive ? ' tnode--active' : ''}" data-suite-uid="${encodeURIComponent(suite.uid)}" style="padding-left:${0.5 + depth * 0.85}rem">
  <span class="${twistyClass}">${twisty}</span>
  <span class="tnode__label" title="${escapeHtml(suite.label)}">${escapeHtml(suite.label)}</span>
  ${failBadge}
  <span class="tnode__count">${entry.total}</span>
</div>`;

  const children = suite.suites.map((child) => renderNode(child, counts, activeUid, depth + 1)).join('');
  return self + children;
}

export function renderSuiteTree(state: State): string {
  const counts = countBySuite(state.report.results.tests);
  const total = state.report.results.summary.tests;
  const isAll = state.filterOnSuiteUid === '';
  // The NO_SUITE placeholder shares uid '' with "All tests"; it cannot be selected
  // distinctly, so drop it from the tree — "All tests" already represents those.
  const nodes = state.suites
    .filter((suite) => suite.uid !== NO_SUITE_ID)
    .map((suite) => renderNode(suite, counts, state.filterOnSuiteUid, 0))
    .join('');

  return `<nav class="sidebar" id="suiteTree">
  <div class="tree__title">Suites</div>
  <div class="tnode${isAll ? ' tnode--active' : ''}" data-suite-uid="">
    <span class="tnode__twisty tnode__twisty--leaf"></span>
    <span class="tnode__label">All tests</span>
    <span class="tnode__count">${total}</span>
  </div>
  ${nodes}
</nav>`;
}
