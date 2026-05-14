import { createEmptyTestResults, SPEC_VERSION } from '../../types/CommonTestReportFormat.js';
import { AbstractUserInterfaceController } from '../../utils/ui/AbstractUserInterfaceController.js';
import { FILTER_ON_STATUS, SORT_BY } from './constants.js';
import { buildSuites, SUITE_SEPARATOR } from './suites.js';
import type { Settings, State, Actions } from './types.js';

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

  private _filter() {
    let tests = this._state.report.results.tests;
    const { filterOnSuiteUid, filterOnStatus } = this._state;
    if (filterOnSuiteUid) {
      tests = tests.filter((test) => test.suite?.join(SUITE_SEPARATOR)?.startsWith(filterOnSuiteUid));
    }
    if (filterOnStatus) {
      tests =
        filterOnStatus === 'other'
          ? tests.filter((test) => !['passed', 'failed'].includes(test.status))
          : tests.filter((test) => test.status === filterOnStatus);
    }
    return tests;
  }

  protected override _onInteraction(stateDiff: Partial<State>, action?: Actions) {
    let update: Partial<State> = {};
    let triggerUpdate = false;
    if (stateDiff.report) {
      this._reset();
      this._state.report = stateDiff.report;
      update = {
        ...this._state,
        mode: 'display'
      };
      triggerUpdate = true;
    }
    let tests = this._state.report.results.tests;
    if (
      stateDiff.filterOnSuiteUid !== undefined ||
      stateDiff.filterOnStatus !== undefined ||
      stateDiff.search !== undefined
    ) {
      tests = this._filter();
      triggerUpdate = true;
    }
    if (triggerUpdate) {
      const suites = buildSuites(tests);
      this._update({
        ...update,
        tests,
        suites
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
