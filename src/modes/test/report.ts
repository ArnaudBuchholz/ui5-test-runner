import { assert } from '../../platform/assert.js';
import { version } from '../../platform/version.js';
import { createEmptyTestResults } from '../../types/CommonTestReportFormat.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import { randomUUID } from 'node:crypto';

export class TestReportMerger {
  private _merged: CommonTestReport | undefined;

  get merged(): CommonTestReport {
    assert(this._merged !== undefined);
    return this._merged;
  }

  async initialize(): Promise<void> {
    this._merged = {
      reportFormat: 'CTRF',
      specVersion: 'pre-1.0',
      reportId: randomUUID(),
      timestamp: new Date().toISOString(),
      generatedBy: await version(),
      results: createEmptyTestResults()
    };
    this._merged.results.summary.start = Date.now();
  }

  merge(testResults: CommonTestReport['results']) {
    assert(this._merged !== undefined);
    const { name: toolName } = this._merged.results.tool;
    if (toolName === '') {
      this._merged.results.tool = testResults.tool;
    } else {
      assert(toolName === testResults.tool.name); // TODO: what to do otherwise ?
    }
    const { results } = this._merged;
    // eslint-disable-next-line unicorn/prefer-spread -- because not scalable
    results.tests = results.tests.concat(testResults.tests);
    const summaryFields = ['tests', 'passed', 'failed', 'skipped', 'pending', 'other'] as const;
    for (const summaryField of summaryFields) {
      results.summary[summaryField] += testResults.summary[summaryField];
    }
  }

  finalize() {
    assert(this._merged !== undefined);
    const { summary } = this._merged.results;
    summary.stop = Date.now();
    summary.duration = summary.start - summary.stop;
  }
}

export const report = new TestReportMerger();
