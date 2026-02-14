import { assert } from '../../platform/assert.js';
import { version } from '../../platform/version.js';
import { createEmptyTestResults, type CommonTestReport } from '../../types/CommonTestReportFormat.js';
import { randomUUID } from 'node:crypto';

export class TestReportGenerator {
  private _report: CommonTestReport | undefined;

  get report (): CommonTestReport {
    assert(this._report !== undefined);
    return this._report;
  }

  async initialize(): Promise<void> {
    this._report = {
      reportFormat: 'CTRF',
      specVersion: 'pre-1.0',
      reportId: randomUUID(),
      timestamp: new Date().toISOString(),
      generatedBy: await version(),
      results: createEmptyTestResults()
    };
    this._report.results.summary.start = Date.now();
  }

  merge (testResults: CommonTestReport['results']) {
    assert(this._report !== undefined);
    // TODO: what about testResults.tool
    const { results } = this._report;
    results.tests = results.tests.concat(testResults.tests);
    const summaryFields = ['tests', 'passed', 'failed', 'skipped', 'pending', 'other'] as const;
    for (const summaryField of summaryFields) {
      results.summary[summaryField] += testResults.summary[summaryField];
    }
  }

  finalize () {
    assert(this._report !== undefined);
    const { summary } = this._report.results;
    summary.stop = Date.now();
    summary.duration = summary.start - summary.stop;
  }
}

export const report = new TestReportGenerator();
