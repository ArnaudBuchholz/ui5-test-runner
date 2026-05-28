import type { CTRFTest } from '../types/CommonTestReportFormat.js';
import { createEmptyTestResults } from '../types/CommonTestReportFormat.js';

export class AgentTestResultsBuilder {
  private _results = createEmptyTestResults();

  get results() {
    return this._results;
  }

  reset(): void {
    this._results = createEmptyTestResults();
  }

  begin(tool: string): void {
    const [name, version] = tool.split('@');
    this._results.tool.name = name!; // cannot be undefined
    if (version !== undefined) {
      this._results.tool.version = version;
    }
    this._results.summary.start = Date.now();
  }

  test(test: CTRFTest): void {
    const { summary } = this._results;
    ++summary.tests;
    ++summary[test.status];
    this._results.tests.push(test);
  }

  end(): void {
    const { summary } = this._results;
    summary.stop = Date.now();
    summary.duration = summary.stop - summary.start;
  }
}

export const report = new AgentTestResultsBuilder();
export const results = report.results;
