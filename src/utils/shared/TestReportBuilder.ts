import { createEmptyTestResults } from '../../types/CommonTestReportFormat.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';

const SUMMARY_FIELDS = ['tests', 'passed', 'failed', 'skipped', 'pending', 'other'] as const;

export class TestReportBuilder {
  private _report: CommonTestReport;
  private _suites: { [url in string]?: readonly string[] } = {};

  get report(): CommonTestReport {
    return this._report;
  }

  constructor(reportId: string, generatedBy: string) {
    this._report = {
      reportFormat: 'CTRF',
      specVersion: 'pre-1.0',
      reportId,
      timestamp: new Date().toISOString(),
      generatedBy,
      results: createEmptyTestResults()
    };
    this._report.results.summary.start = Date.now();
  }

  addSuite(suiteUrl: string, pageUrls: string[]) {
    const parentUrls = this._suites[suiteUrl] ?? [];
    for (const pageUrl of pageUrls) {
      this._suites[pageUrl] = [...parentUrls, suiteUrl];
    }
  }

  merge(url: string, testResults: CommonTestReport['results']) {
    const { name: toolName } = this._report.results.tool;
    // TODO: what if the tool name changes between different test results ?
    if (testResults.tool.name && toolName === '') {
      this._report.results.tool = testResults.tool;
    }
    const { results } = this._report;
    const suites = [...(this._suites[url] ?? []), url];
    for (const test of testResults.tests) {
      results.tests.push({
        ...test,
        suite: [...suites, ...(test.suite ?? [])] as [string, ...string[]]
      });
    }
    for (const summaryField of SUMMARY_FIELDS) {
      results.summary[summaryField] += testResults.summary[summaryField];
    }
  }

  finalize() {
    const { summary } = this._report.results;
    summary.stop = Date.now();
    summary.duration = summary.stop - summary.start;
  }
}
