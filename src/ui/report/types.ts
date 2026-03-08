import type { CommonTestReport } from '../../../src/types/CommonTestReportFormat.js';

export interface State {
  report: CommonTestReport | null;
  filters: {
    suite: string;
    status: string;
    search: string;
  };
  sort: {
    criteria: 'name' | 'status' | 'duration' | 'none';
    order: 'asc' | 'desc';
  };
  invalidReport: boolean;
}

export interface SuiteNode {
  name: string;
  fullName: string;
  children: Map<string, SuiteNode>;
}
