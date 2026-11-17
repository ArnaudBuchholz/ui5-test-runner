import type { State, Settings } from '../../../reports/ui/types.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export function renderToolbar(state: State, settings: Settings): string {
  const statusOptions = settings.filterOnStatus
    .map(
      (option) =>
        `<option value="${option.key}"${state.filterOnStatus === option.key ? ' selected' : ''}>${escapeHtml(option.label)}</option>`
    )
    .join('');

  const sortOptions = settings.sortBy
    .map(
      (option) =>
        `<option value="${option.key}"${state.sortBy === option.key ? ' selected' : ''}>${escapeHtml(option.label)}</option>`
    )
    .join('');

  const shown = state.tests.length;
  const total = state.report.results.summary.tests;

  return `<div class="toolbar">
  <div class="field">
    <label for="statusSelect">Status</label>
    <select id="statusSelect" class="select">${statusOptions}</select>
  </div>
  <div class="field">
    <label for="searchInput">Search</label>
    <input id="searchInput" class="input" type="search" placeholder="Filter by test name…" value="${escapeHtml(state.search)}" />
  </div>
  <div class="field">
    <label for="sortSelect">Sort</label>
    <select id="sortSelect" class="select">${sortOptions}</select>
    <button id="sortDirBtn" class="btn btn--icon" title="Toggle sort direction"${state.sortBy === '' ? ' disabled' : ''}>${state.sortAscending ? '↑' : '↓'}</button>
  </div>
  <span class="toolbar__count">${shown} of ${total} shown</span>
</div>`;
}
