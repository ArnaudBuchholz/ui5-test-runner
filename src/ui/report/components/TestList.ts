import type { State } from '../types.js';
import { formatDuration, prettifyUrl } from '../utils/ctrf.js';

function getDesign(status: string): string {
  if (status === 'passed') {
    return 'Positive';
  }
  if (status === 'failed') {
    return 'Negative';
  }
  return 'Neutral';
}

function getSuites(suite: string | readonly string[] | undefined): string[] {
  if (Array.isArray(suite)) {
    return [...(suite as string[])];
  }
  if (suite) {
    return [suite as string];
  }
  return [];
}

export function renderTestList(state: State): string {
  const { report, filters, sort } = state;
  if (!report) {
    return '';
  }

  let { tests } = report.results;

  // Filtering
  tests = tests.filter((test) => {
    const suites = getSuites(test.suite);
    const suiteString = suites.join(' > ') || 'No suite';

    if (filters.suite && !suiteString.startsWith(filters.suite)) {
      return false;
    }
    if (filters.status && test.status !== filters.status) {
      return false;
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchName = test.name.toLowerCase().includes(search);
      const matchSuite = suiteString.toLowerCase().includes(search);
      if (!matchName && !matchSuite) {
        return false;
      }
    }
    return true;
  });

  const totalFiltered = tests.length;
  const tooManyTests = totalFiltered > 1000;

  // Sorting
  let testsToDisplay = [...tests];
  if (sort.criteria !== 'none') {
    testsToDisplay.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;
      if (sort.criteria === 'name') {
        valueA = a.name;
        valueB = b.name;
      } else if (sort.criteria === 'status') {
        valueA = a.status;
        valueB = b.status;
      } else if (sort.criteria === 'duration') {
        valueA = a.duration;
        valueB = b.duration;
      } else {
        return 0;
      }

      if (valueA < valueB) {
        return sort.order === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sort.order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  if (tooManyTests) {
    testsToDisplay = testsToDisplay.slice(0, 1000);
  }

  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const failedCount = tests.filter((t) => t.status === 'failed').length;
  const skippedCount = tests.filter((t) => t.status === 'skipped').length;

  const testItemsHtml = testsToDisplay
    .map((test) => {
      const suites = getSuites(test.suite);
      const suiteHtml = suites
        .map((s) => `<span class="suite-breadcrumb" title="${s}">${prettifyUrl(s)}</span>`)
        .join(' > ');
      const design = getDesign(test.status);

      let detailsHtml = `<p><ui5-label>Duration:</ui5-label> ${formatDuration(test.duration)}</p>`;
      if (test.message) {
        detailsHtml += `<p><ui5-label>Message:</ui5-label> <span style="white-space: pre-wrap;">${test.message}</span></p>`;
      }
      if (test.trace) {
        detailsHtml += `
            <p><ui5-label>Stack Trace:</ui5-label></p>
            <div class="stack-trace">${test.trace}</div>
        `;
      }

      return `
            <div class="test-item">
                <div class="test-item-header">
                    <ui5-icon name="navigation-right-arrow" style="margin-right: 0.5rem;"></ui5-icon>
                    <span class="suite-breadcrumb">${suiteHtml}</span>
                    <span class="test-name">${test.name}</span>
                    <ui5-tag class="test-status" design="${design}">${test.status}</ui5-tag>
                </div>
                <div class="test-details">${detailsHtml}</div>
            </div>
        `;
    })
    .join('');

  let headerHtml = '';
  if (tooManyTests) {
    headerHtml = `
            <ui5-message-strip design="Warning" style="margin-bottom: 1rem;">
                More than 1000 tests match the criteria. Only the first 1000 are displayed. Please use filtering to narrow down.
            </ui5-message-strip>
        `;
  }

  return `
        <div class="test-list-container">
            ${headerHtml}
            <div class="test-list-header">
                <ui5-title level="H4">Tests (${totalFiltered})</ui5-title>
                <div class="summary-counts">
                    <ui5-tag design="Positive">${passedCount} passed</ui5-tag>
                    <ui5-tag design="Negative">${failedCount} failed</ui5-tag>
                    <ui5-tag design="Neutral">${skippedCount} skipped</ui5-tag>
                </div>
            </div>
            <div class="sort-bar">
                <ui5-label>Sort By:</ui5-label>
                <ui5-segmented-button id="sortCriteria">
                    <ui5-segmented-button-item data-sort="none" ${sort.criteria === 'none' ? 'selected' : ''}>Default</ui5-segmented-button-item>
                    <ui5-segmented-button-item data-sort="name" ${sort.criteria === 'name' ? 'selected' : ''}>Name</ui5-segmented-button-item>
                    <ui5-segmented-button-item data-sort="status" ${sort.criteria === 'status' ? 'selected' : ''}>Status</ui5-segmented-button-item>
                    <ui5-segmented-button-item data-sort="duration" ${sort.criteria === 'duration' ? 'selected' : ''}>Duration</ui5-segmented-button-item>
                </ui5-segmented-button>
                <ui5-toggle-button id="sortOrder" icon="${sort.order === 'asc' ? 'sort-ascending' : 'sort-descending'}" ${sort.order === 'desc' ? 'pressed' : ''} design="Transparent" ${sort.criteria === 'none' ? 'disabled' : ''}>Invert</ui5-toggle-button>
            </div>
            ${totalFiltered === 0 ? '<p style="padding: 2rem; text-align: center;">No test match the criteria.</p>' : testItemsHtml}
        </div>
    `;
}
