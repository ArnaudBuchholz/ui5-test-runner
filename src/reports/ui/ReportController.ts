import { createEmptyTestResults, SPEC_VERSION } from '../../types/CommonTestReportFormat.js';
import { AbstractUserInterfaceController } from '../../utils/AbstractUserInterfaceController.js';
import { FILTER_ON_STATUS, SORT_BY } from './constants.js';
import type { Settings, State, Actions } from './types.js';

export class ReportController extends AbstractUserInterfaceController<Settings, State, Actions> {
  constructor() {
    super();
    this._settings = {
      filterOnStatus: FILTER_ON_STATUS,
      sortBy: SORT_BY
    };
    this._state = {
      report: {
        reportFormat: 'CTRF',
        specVersion: SPEC_VERSION,
        results: createEmptyTestResults()
      },
      suiteId: '',
      filterOnStatus: '',
      search: '',
      sortBy: '',
      sortAscending: true,
      mode: 'open',
      suites: [],
      tests: []
    };
  }

  protected override _onInteraction(stateDiff: Partial<State>, action?: Actions) {
    if (action !== undefined) {
      void this[action]();
    }
  }

  protected async export() {}
}
