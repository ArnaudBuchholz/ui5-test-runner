import { it, expect, vi } from 'vitest';
import { ReportController } from './ReportController.js';
import type { State } from './types.js';
import { createEmptyTestResults, createTestResults, SPEC_VERSION } from '../../types/CommonTestReportFormat.js';
import { TestReportBuilder } from '../../utils/shared/TestReportBuilder.js';

const REPORT_ID = 'report-id' as const;
const REPORT_GENERATED_BY = 'test' as const;

it('has an empty initial state', () => {
  const controller = new ReportController();
  expect(controller.state).toStrictEqual<State>({
    report: {
      reportFormat: 'CTRF',
      specVersion: SPEC_VERSION,
      results: createEmptyTestResults()
    },
    filterOnSuiteId: '',
    filterOnStatus: '',
    search: '',
    sortBy: '',
    sortAscending: true,
    mode: 'open',
    suites: [],
    tests: []
  });
});

it.skip('shows the report when set', () => {
  const reportBuilder = new TestReportBuilder(REPORT_ID, REPORT_GENERATED_BY);
  reportBuilder.merge('http://localhost', createTestResults({
    tests: [{
      suite: ['test'],
      name: 'test',
      status: 'passed'
    }]
  }));
  reportBuilder.finalize();
  const { report } = reportBuilder;
  const controller = new ReportController();
  const update = vi.fn();
  controller.connect(update);
  controller.interaction({
    report
  });
  expect(update).toHaveBeenCalledWith({
    report,
    mode: 'display',
    suites: [],
    tests: report.results.tests
  });
})
