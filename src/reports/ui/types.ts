import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import type { SORT_BY, FILTER_ON_STATUS } from './constants.js';

export type Suite = {
  id: string;
  label: string;
  url: string;
  suites: Suite[];
};

export type Settings = {
  sortBy: typeof SORT_BY;
  filterOnStatus: typeof FILTER_ON_STATUS;
};

export type State = {
  report: CommonTestReport;
  filterOnSuiteId: string;
  filterOnStatus: (typeof FILTER_ON_STATUS)[number]['key'];
  search: string;
  sortBy: (typeof SORT_BY)[number]['key'];
  sortAscending: boolean;
  readonly mode: /** asks user to pick a file to open */
    | 'open'
    /** displays report */
    | 'display';
  readonly suites: Suite[];
  readonly tests: CommonTestReport['results']['tests'];
};

export type Actions = 'export';
