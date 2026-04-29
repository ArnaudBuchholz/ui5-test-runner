import { it, expect, beforeEach } from 'vitest';
import { TestReportBuilder } from './TestReportBuilder.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import { createEmptyTestResults, createTestResults } from '../../types/CommonTestReportFormat.js';
import { logger } from '../../platform/logger.js';

const REPORT_ID = 'report-id';
const GENERATED_BY = 'ui5-test-runner@1.2.3';

const comparableTestReport = (testResults: Partial<CommonTestReport['results']> = {}) => {
  const emptyTestReport: CommonTestReport = {
    reportFormat: 'CTRF',
    specVersion: 'pre-1.0',
    reportId: REPORT_ID,
    timestamp: expect.any(String) as string,
    generatedBy: GENERATED_BY,
    results: createEmptyTestResults()
  };
  Object.assign(emptyTestReport.results, testResults);
  emptyTestReport.results.summary.start = expect.any(Number) as number;
  emptyTestReport.results.summary.stop = expect.any(Number) as number;
  emptyTestReport.results.summary.duration = expect.any(Number) as number;
  return emptyTestReport;
};

let reportBuilder: TestReportBuilder;

beforeEach(() => {
  reportBuilder = new TestReportBuilder(REPORT_ID, GENERATED_BY);
});

it('returns an empty report', () => {
  expect(reportBuilder.report).toStrictEqual(comparableTestReport());
});

it('merges test results (1)', () => {
  const test0 = {
    name: 'test0',
    status: 'passed',
    duration: 1
  } as const;
  reportBuilder.merge('http://localhost:8080/test0', {
    tool: { name: 'test' },
    tests: [test0],
    summary: {
      failed: 0,
      other: 0,
      passed: 1,
      pending: 0,
      skipped: 0,
      start: 123,
      stop: 456,
      tests: 1
    }
  });
  reportBuilder.finalize();
  expect(reportBuilder.report).toStrictEqual(
    comparableTestReport({
      tool: { name: 'test' },
      tests: [
        {
          ...test0,
          suite: ['http://localhost:8080/test0']
        }
      ],
      summary: {
        failed: 0,
        other: 0,
        passed: 1,
        pending: 0,
        skipped: 0,
        start: 0,
        stop: 0,
        tests: 1
      }
    })
  );
});

it('merges test results (2)', () => {
  const test0 = {
    name: 'test0',
    status: 'passed',
    duration: 1
  } as const;
  reportBuilder.merge('http://localhost:8080/test0', {
    tool: { name: 'test' },
    tests: [test0],
    summary: {
      failed: 0,
      other: 0,
      passed: 1,
      pending: 0,
      skipped: 0,
      start: 123,
      stop: 456,
      tests: 1
    }
  });
  const test1 = {
    name: 'test1',
    status: 'failed',
    duration: 1,
    suite: ['test1']
  } as const;
  reportBuilder.merge('http://localhost:8080/test1', {
    tool: { name: 'test' },
    tests: [test1],
    summary: {
      failed: 1,
      other: 0,
      passed: 0,
      pending: 0,
      skipped: 0,
      start: 123,
      stop: 456,
      tests: 1
    }
  });
  reportBuilder.finalize();
  expect(reportBuilder.report).toStrictEqual(
    comparableTestReport({
      tool: { name: 'test' },
      tests: [
        {
          ...test0,
          suite: ['http://localhost:8080/test0']
        },
        {
          ...test1,
          suite: ['http://localhost:8080/test1', 'test1']
        }
      ],
      summary: {
        failed: 1,
        other: 0,
        passed: 1,
        pending: 0,
        skipped: 0,
        start: 0,
        stop: 0,
        tests: 2
      }
    })
  );
});

it('supports suite construction', () => {
  reportBuilder.addSuite('http://localhost:8080/suite0', [
    'http://localhost:8080/test0',
    'http://localhost:8080/suite1'
  ]);
  reportBuilder.addSuite('http://localhost:8080/suite1', ['http://localhost:8080/test1']);
  const test0 = {
    name: 'test0',
    status: 'passed',
    duration: 1
  } as const;
  reportBuilder.merge('http://localhost:8080/test0', {
    tool: { name: 'test' },
    tests: [test0],
    summary: {
      failed: 0,
      other: 0,
      passed: 1,
      pending: 0,
      skipped: 0,
      start: 123,
      stop: 456,
      tests: 1
    }
  });
  const test1 = {
    name: 'test1',
    status: 'failed',
    duration: 1,
    suite: ['test1']
  } as const;
  reportBuilder.merge('http://localhost:8080/test1', {
    tool: { name: 'test' },
    tests: [test1],
    summary: {
      failed: 1,
      other: 0,
      passed: 0,
      pending: 0,
      skipped: 0,
      start: 123,
      stop: 456,
      tests: 1
    }
  });
  reportBuilder.finalize();
  expect(reportBuilder.report).toStrictEqual(
    comparableTestReport({
      tool: { name: 'test' },
      tests: [
        {
          ...test0,
          suite: ['http://localhost:8080/suite0', 'http://localhost:8080/test0']
        },
        {
          ...test1,
          suite: [
            'http://localhost:8080/suite0',
            'http://localhost:8080/suite1',
            'http://localhost:8080/test1',
            'test1'
          ]
        }
      ],
      summary: {
        failed: 1,
        other: 0,
        passed: 1,
        pending: 0,
        skipped: 0,
        start: 0,
        stop: 0,
        tests: 2
      }
    })
  );
});
