import type { State, Suite, Settings } from '../../../reports/ui/types.js';

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function flattenSuites(suites: Suite[]): Suite[] {
  return suites.flatMap((suite) => [suite, ...flattenSuites(suite.suites)]);
}

function suiteLabelFor(suites: Suite[], uid: string): string {
  if (!uid) return 'All suites';
  return flattenSuites(suites).find((s) => s.uid === uid)?.label ?? 'Unknown suite';
}

function renderSuiteItems(suites: Suite[], currentUid: string, depth: number): string {
  return suites
    .map((suite) => {
      const isActive = suite.uid === currentUid;
      const encodedUid = encodeURIComponent(suite.uid);
      return (
        `<div class="suite-item${isActive ? ' suite-item--active' : ''}" data-suite-uid="${encodedUid}" style="padding-left:${depth * 1.25}rem">${escapeHtml(suite.label)}</div>` +
        renderSuiteItems(suite.suites, currentUid, depth + 1)
      );
    })
    .join('');
}

export function renderFilterBar(state: State, settings: Settings): string {
  const suiteLabel = escapeHtml(suiteLabelFor(state.suites, state.filterOnSuiteUid));

  const statusOptions = settings.filterOnStatus
    .map(
      (opt) =>
        `<ui5-option value="${opt.key}"${state.filterOnStatus === opt.key ? ' selected' : ''}>${escapeHtml(opt.label)}</ui5-option>`
    )
    .join('');

  return `<div class="filter-bar">
  <div class="filter-field">
    <ui5-label>Suite</ui5-label>
    <ui5-button id="suiteFilterBtn" design="Default">${suiteLabel} &#9662;</ui5-button>
  </div>
  <div class="filter-field">
    <ui5-label>Status</ui5-label>
    <ui5-select id="statusSelect">${statusOptions}</ui5-select>
  </div>
  <div class="filter-field filter-field--grow">
    <ui5-label>Search</ui5-label>
    <ui5-input id="searchInput" value="${escapeHtml(state.search)}" placeholder="Search tests..."></ui5-input>
  </div>
</div>`;
}

export function renderSuitePopoverContent(suites: Suite[], currentUid: string): string {
  const allActive = currentUid === '';
  return (
    `<div class="suite-item${allActive ? ' suite-item--active' : ''}" data-suite-uid="">All suites</div>` +
    renderSuiteItems(suites, currentUid, 1)
  );
}
