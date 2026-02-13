import type { CommonTestReport } from '../types/CommonTestReportFormat.js';
import type { ITestResult, ITestResultsBuilder } from '../types/ITestResultsBuilder.js';

export class AgentTestResultsBuilder implements ITestResultsBuilder {
  private _results: CommonTestReport['results'] = {
    tool: {
      name: 'unknown'
    },
    summary: {
      failed: 0,
      other: 0,
      passed: 0,
      pending: 0,
      skipped: 0,
      start: 0,
      stop: 0,
      tests: 0,
      duration: 0
    },
    tests: []
  };

  get results() {
    return this._results;
  }

  begin(tool: string): void {
    const [name, version] = tool.split('@');
    this._results.tool.name = name || 'unknown';
    if (version !== undefined) {
      this._results.tool.version = version;
    }
    this._results.summary.start = Date.now();
  }

  test(result: ITestResult): void {
    const { summary } = this._results;
    ++summary.tests;
    ++summary[result.status];
    const test: CommonTestReport['results']['tests'][number] = {
      duration: result.duration,
      name: result.label,
      status: result.status
    };
    if (typeof result.suite === 'string') {
      test.suite = [result.suite];
    } else if (Array.isArray(result.suite)) {
      test.suite = result.suite;
    }
    this._results.tests.push(test);
  }

  end(): void {
    const { summary } = this._results;
    summary.stop = Date.now();
    summary.duration = summary.stop - summary.start;
  }
}

export const report: ITestResultsBuilder = new AgentTestResultsBuilder();
export const results = (report as AgentTestResultsBuilder).results;
