import type { InternalLogAttributes } from '../../../platform/logger/types.js';
import { computeFacets, computeIssues } from '../utils/facets.js';
import type { FacetCount } from '../utils/facets.js';
import { escapeHtml } from './EventDetails.js';
import { isFacetSelected } from '../utils/filter.js';
import type { FacetField, FacetSelection } from '../utils/filter.js';

const FACET_TITLES: Record<FacetField, string> = {
  source: 'Source',
  level: 'Level',
  pageId: 'Page',
  processId: 'Process'
};

/** Facets whose long value lists are collapsed to a scrollable box. */
const SCROLLABLE: ReadonlySet<FacetField> = new Set(['pageId', 'processId']);

function facetValue(field: FacetField, item: FacetCount, selection: FacetSelection): string {
  const selected = isFacetSelected(selection, field, item.key) ? ' ev-facet-on' : '';
  return `<button class="ev-facet-item${selected}" data-facet="${field}" data-key="${escapeHtml(item.key)}">
    <span class="ev-facet-label">${escapeHtml(item.label)}</span>
    <span class="ev-facet-count">${item.count}</span>
  </button>`;
}

function facetGroup(field: FacetField, items: FacetCount[], selection: FacetSelection): string {
  if (items.length === 0) {
    return '';
  }
  const scroll = SCROLLABLE.has(field) ? ' ev-facet-scroll' : '';
  const body = items.map((item) => facetValue(field, item, selection)).join('');
  return `<div class="ev-facet-group">
    <div class="ev-facet-title">${FACET_TITLES[field]}</div>
    <div class="ev-facet-items${scroll}">${body}</div>
  </div>`;
}

function issuesPanel(logs: ReadonlyArray<InternalLogAttributes>): string {
  const { errors, warns, failingPages } = computeIssues(logs);
  const pages = failingPages.length;
  return `<div class="ev-issues">
    <button class="ev-issue ev-issue-error" data-issue="errors" ${errors ? '' : 'disabled'}>
      <span class="ev-issue-n">${errors}</span><span class="ev-issue-l">errors</span>
    </button>
    <button class="ev-issue ev-issue-warn" data-issue="warns" ${warns ? '' : 'disabled'}>
      <span class="ev-issue-n">${warns}</span><span class="ev-issue-l">warnings</span>
    </button>
    <button class="ev-issue ev-issue-page" data-issue="failingPages"
      data-pages="${failingPages.join(',')}" ${pages ? '' : 'disabled'}>
      <span class="ev-issue-n">${pages}</span><span class="ev-issue-l">failing pages</span>
    </button>
  </div>`;
}

/** Render the left rail: triage issues on top, then value facets with live counts. */
export function renderFacetRail(logs: ReadonlyArray<InternalLogAttributes>, selection: FacetSelection): string {
  const facets = computeFacets(logs);
  return (
    issuesPanel(logs) +
    (['level', 'source', 'pageId', 'processId'] as FacetField[])
      .map((field) => facetGroup(field, facets[field], selection))
      .join('')
  );
}
