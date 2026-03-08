import type { State, SuiteNode } from '../types.js';
import { buildSuiteHierarchy } from '../utils/ctrf.js';

interface GlobalWithCtrf {
  ctrf?: unknown;
}

export function renderFilterBar(state: State): string {
  const { report, filters } = state;
  if (!report) {
    return '';
  }

  const suites = buildSuiteHierarchy(report.results.tests);
  const suiteItems = generateSuiteItems(suites, filters.suite);

  const statuses = new Set<string>();
  for (const test of report.results.tests) {
    statuses.add(test.status);
  }
  const statusOptions = [...statuses]
    .map((s) => `<ui5-option ${filters.status === s ? 'selected' : ''}>${s}</ui5-option>`)
    .join('');

  const showOpenButton = !(globalThis as unknown as GlobalWithCtrf).ctrf;

  return `
        <div class="filter-bar">
            <div class="filter-item">
                <ui5-label>Suite</ui5-label>
                <ui5-input id="suiteFilterInput" value="${filters.suite || 'All Suites'}" readonly placeholder="Select Suite">
                    <ui5-icon slot="icon" name="navigation-down-arrow" id="suiteFilterArrow"></ui5-icon>
                </ui5-input>
                <ui5-popover id="suitePopover" placement-type="Bottom" horizontal-align="Left" style="min-width: 300px;">
                    <ui5-tree id="suiteTree" mode="SingleSelect">
                        <ui5-tree-item text="All Suites" data-value="" ${filters.suite ? '' : 'selected'}></ui5-tree-item>
                        ${suiteItems}
                    </ui5-tree>
                </ui5-popover>
            </div>
            <div class="filter-item">
                <ui5-label>Status</ui5-label>
                <ui5-select id="statusFilter">
                    <ui5-option ${filters.status ? '' : 'selected'} value="">All Statuses</ui5-option>
                    ${statusOptions}
                </ui5-select>
            </div>
            <div class="filter-item" style="flex-grow: 1;">
                <ui5-label>Search</ui5-label>
                <ui5-input id="searchFilter" value="${filters.search}" placeholder="Search suite or test name..."></ui5-input>
            </div>
            ${showOpenButton ? '<ui5-button id="openBtn" icon="open-folder" design="Transparent">Open</ui5-button>' : ''}
        </div>
    `;
}

function generateSuiteItems(node: SuiteNode, selectedSuite: string): string {
  let items = '';
  for (const child of node.children.values()) {
    const isSelected = selectedSuite === child.fullName;
    const hasChildren = child.children.size > 0;
    const childItems = hasChildren ? generateSuiteItems(child, selectedSuite) : '';

    items += `
      <ui5-tree-item 
        text="${child.name}" 
        data-value="${child.fullName}" 
        ${isSelected ? 'selected' : ''}
        ${hasChildren ? 'expanded' : ''}
      >
        ${childItems}
      </ui5-tree-item>
    `;
  }
  return items;
}
