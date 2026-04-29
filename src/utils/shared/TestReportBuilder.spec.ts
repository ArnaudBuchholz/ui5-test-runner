import { it, expect, beforeEach, vi } from 'vitest';
import { TestReportBuilder } from './TestReportBuilder.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import { createEmptyTestResults, createTestResults } from '../../types/CommonTestReportFormat.js';

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
    suite: ['suite0'],
    name: 'test0',
    status: 'passed',
    duration: 1
  } as const;
  reportBuilder.merge(
    'http://localhost:8080/test0',
    createTestResults({
      tool: { name: 'test' },
      tests: [test0],
      summary: {
        start: 123,
        stop: 456
      }
    })
  );
  reportBuilder.finalize();
  expect(reportBuilder.report).toStrictEqual(
    comparableTestReport({
      tool: { name: 'test' },
      tests: [
        {
          ...test0,
          suite: ['http://localhost:8080/test0', 'suite0']
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
    suite: ['suite0'],
    name: 'test0',
    status: 'passed',
    duration: 1
  } as const;
  reportBuilder.merge(
    'http://localhost:8080/test0',
    createTestResults({
      tool: { name: 'test' },
      tests: [test0],
      summary: {
        start: 123,
        stop: 456
      }
    })
  );
  const test1 = {
    name: 'test1',
    status: 'failed',
    duration: 1,
    suite: ['suite1', 'test1']
  } as const;
  reportBuilder.merge(
    'http://localhost:8080/test1',
    createTestResults({
      tests: [test1],
      summary: {
        start: 123,
        stop: 456
      }
    })
  );
  reportBuilder.finalize();
  expect(reportBuilder.report).toStrictEqual(
    comparableTestReport({
      tool: { name: 'test' },
      tests: [
        {
          ...test0,
          suite: ['http://localhost:8080/test0', 'suite0']
        },
        {
          ...test1,
          suite: ['http://localhost:8080/test1', 'suite1', 'test1']
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
  reportBuilder.merge(
    'http://localhost:8080/test0',
    createTestResults({
      tests: [test0]
    })
  );
  const test1 = {
    name: 'test1',
    status: 'failed',
    duration: 1,
    suite: ['test1']
  } as const;
  reportBuilder.merge(
    'http://localhost:8080/test1',
    createTestResults({
      tests: [test1]
    })
  );
  reportBuilder.finalize();
  expect(reportBuilder.report).toStrictEqual(
    comparableTestReport({
      tool: { name: '' },
      tests: [
        {
          ...test0,
          suite: ['http://localhost:8080/suite0', 'http://localhost:8080/test0', 'suite']
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

it('takes care of the summary duration', async () => {
  const now = Date.now();
  vi.setSystemTime(now);
  const reportBuilder = new TestReportBuilder(REPORT_ID, GENERATED_BY);
  vi.setSystemTime(now + 100);
  reportBuilder.finalize();
  expect(reportBuilder.report.results.summary.start).toStrictEqual(now);
  expect(reportBuilder.report.results.summary.stop).toStrictEqual(now + 100);
  expect(reportBuilder.report.results.summary.duration).toBeGreaterThanOrEqual(100);
  vi.useRealTimers();
});
