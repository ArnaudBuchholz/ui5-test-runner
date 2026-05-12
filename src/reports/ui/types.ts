import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import type { SORT_BY, FILTER_ON_STATUS } from './constants.js';

export type Suite = {
  /** globally unique ID to ensure we can easily identify children */
  uid: string;
  /** label for the user, might be the test module name or the page URL (shortened) */
  label: string;
  /** children suites */
  suites: Suite[];
};

export type Settings = {
  sortBy: typeof SORT_BY;
  filterOnStatus: typeof FILTER_ON_STATUS;
};

export type State = {
  report: CommonTestReport;
  /** should match one suite.uid */
  filterOnSuiteUid: string;
  filterOnStatus: (typeof FILTER_ON_STATUS)[number]['key'];
  /** free text search */
  search: string;
  sortBy: (typeof SORT_BY)[number]['key'];
  sortAscending: boolean;
  readonly mode:
    /** asks user to pick a file to open */
    | 'open'
    /** displays report */
    | 'display';
  readonly suites: Suite[];
  readonly tests: CommonTestReport['results']['tests'];
};

export type Actions = 'export';
