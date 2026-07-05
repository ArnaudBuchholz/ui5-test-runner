import { createEmptyTestResults, SPEC_VERSION } from '../../types/CommonTestReportFormat.js';
import type { CTRFTest } from '../../types/CommonTestReportFormat.js';
import { AbstractUserInterfaceController } from '../../utils/ui/AbstractUserInterfaceController.js';
import { FILTER_ON_STATUS, SORT_BY } from './constants.js';
import { buildSuites, findSuite, SUITE_SEPARATOR } from './suites.js';
import { BREADCRUMBS } from './types.js';
import type { Settings, State, Actions, TestAndBreadcrumbs, Suite } from './types.js';

export class ReportController extends AbstractUserInterfaceController<Settings, State, Actions> {
  constructor() {
    super();
    this._settings = {
      filterOnStatus: FILTER_ON_STATUS,
      sortBy: SORT_BY
    };
    this._reset();
  }

  private _reset() {
    this._state = {
      report: {
        reportFormat: 'CTRF',
        specVersion: SPEC_VERSION,
        results: createEmptyTestResults()
      },
      filterOnSuiteUid: '',
      filterOnStatus: '',
      search: '',
      sortBy: '',
      sortAscending: true,
      mode: 'open',
      suites: [],
      tests: []
    };
  }

  private _needFilterOrSort(stateDiff: Partial<State>) {
    return (
      stateDiff.filterOnSuiteUid !== undefined ||
      stateDiff.filterOnStatus !== undefined ||
      stateDiff.search !== undefined ||
      stateDiff.sortBy !== undefined ||
      stateDiff.sortAscending !== undefined
    );
  }

  private _filter(tests: CTRFTest[]) {
    const { filterOnSuiteUid, filterOnStatus, search } = this._state;
    if (filterOnSuiteUid) {
      tests = tests.filter((test) => test.suite?.join(SUITE_SEPARATOR)?.startsWith(filterOnSuiteUid));
    }
    if (filterOnStatus) {
      tests =
        filterOnStatus === 'other'
          ? tests.filter((test) => !['passed', 'failed'].includes(test.status))
          : tests.filter((test) => test.status === filterOnStatus);
    }
    if (search) {
      tests = tests.filter((test) => test.name.includes(search));
    }
    return tests;
  }

  private _sort(tests: CTRFTest[]) {
    const { sortBy, sortAscending } = this._state;
    if (!sortBy) {
      return tests;
    }
    const results = tests.toSorted((test1, test2) => {
      if (sortBy === 'name') {
        return test1.name.localeCompare(test2.name);
      }
      if (sortBy === 'duration') {
        return test1.duration - test2.duration;
      }
      return 0;
    });
    if (!sortAscending) {
      results.reverse();
    }
    return results;
  }

  private _injectBreadcrumbs(tests: CTRFTest[], suites: Suite[]) {
    for (const test of tests) {
      const breadcrumbs: Suite[] = [];
      let parent = {
        uid: '',
        label: '',
        suites
      } satisfies Suite;
      const suitePath: string[] = [];
      for (const suiteId of test.suite ?? []) {
        suitePath.push(suiteId);
        const suiteUid = suitePath.join(SUITE_SEPARATOR);
        const suite = findSuite(parent.suites, suiteUid);
        if (!suite) {
          break;
        }
        breadcrumbs.push(suite);
        parent = suite;
      }
      Object.assign(test, {
        [BREADCRUMBS]: breadcrumbs
      });
    }
  }

  protected override _onInteraction(stateDiff: Partial<State>, action?: Actions) {
    let update: Partial<State> = {};
    let shouldTriggerUpdate = false;
    let suites: Suite[];
    if (stateDiff.report) {
      this._reset();
      this._state.report = stateDiff.report;
      suites = buildSuites(this._state.report.results.tests);
      this._injectBreadcrumbs(this._state.report.results.tests, suites);
      update = {
        ...this._state,
        suites,
        mode: 'display'
      };
      shouldTriggerUpdate = true;
    }
    let tests = this._state.report.results.tests;
    if (this._needFilterOrSort(stateDiff)) {
      tests = this._filter(tests);
      tests = this._sort(tests);
      shouldTriggerUpdate = true;
    }
    if (shouldTriggerUpdate) {
      this._update({
        ...update,
        tests: tests as TestAndBreadcrumbs[]
      });
    }
    if (action !== undefined) {
      this[action]();
    }
  }

  protected export() {
    const link = document.createElement('a');
    const blob = new Blob([JSON.stringify(this._state.report)], {
      type: 'application/json'
    });
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'report.json');
    link.click();
  }
}
