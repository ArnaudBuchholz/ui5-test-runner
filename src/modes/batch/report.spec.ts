import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildBatchReport } from './report.js';
import type { IBatchItem } from './BatchItem.js';
import type { Configuration } from '../../configuration/Configuration.js';

vi.mock('../../reports/initReportBuilder.js');

import { initReportBuilder } from '../../reports/initReportBuilder.js';
import type { TestReportBuilder } from '../../utils/shared/TestReportBuilder.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';

const NO_CONFIGURATION = {} as unknown as Configuration;

const makeBaseReport = (): CommonTestReport => ({
  reportFormat: 'CTRF',
  specVersion: 'pre-1.0',
  reportId: 'test-id',
  timestamp: '2024-01-01T00:00:00.000Z',
  generatedBy: 'ui5-test-runner@1.0.0',
  results: {
    tool: { name: 'ui5-test-runner', version: '1.0.0' },
    summary: { tests: 0, passed: 0, failed: 0, skipped: 0, pending: 0, other: 0, start: 0, stop: 0, duration: 0 },
    tests: []
  }
});

const makeItem = (overrides: Partial<IBatchItem> = {}): IBatchItem => ({
  path: '/projects/my-app',
  id: 'my-app',
  label: 'My App',
  args: ['--cwd', '/projects/my-app'],
  start: new Date(1000),
  end: new Date(3000),
  statusCode: 0,
  ...overrides
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(initReportBuilder).mockResolvedValue({ report: makeBaseReport() } as unknown as TestReportBuilder);
});

describe('buildBatchReport()', () => {
  it('preserves reportFormat and specVersion from the base report', async () => {
    const report = await buildBatchReport([makeItem()], NO_CONFIGURATION);
    expect(report.reportFormat).toBe('CTRF');
    expect(report.specVersion).toBe('pre-1.0');
  });

  it('preserves generatedBy and tool from the base report', async () => {
    const report = await buildBatchReport([makeItem()], NO_CONFIGURATION);
    expect(report.generatedBy).toBe('ui5-test-runner@1.0.0');
    expect(report.results.tool.name).toBe('ui5-test-runner');
    expect(report.results.tool.version).toBe('1.0.0');
  });

  it('maps a passed item to a passed test', async () => {
    const report = await buildBatchReport([makeItem({ statusCode: 0 })], NO_CONFIGURATION);
    expect(report.results.tests[0]!.status).toBe('passed');
  });

  it('maps a failed item to a failed test', async () => {
    const report = await buildBatchReport([makeItem({ statusCode: 1 })], NO_CONFIGURATION);
    expect(report.results.tests[0]!.status).toBe('failed');
  });

  it('maps a skipped item to a skipped test', async () => {
    const report = await buildBatchReport([makeItem({ skipped: true, statusCode: 0 })], NO_CONFIGURATION);
    expect(report.results.tests[0]!.status).toBe('skipped');
  });

  it('uses item label as test name', async () => {
    const report = await buildBatchReport([makeItem({ label: 'My Suite' })], NO_CONFIGURATION);
    expect(report.results.tests[0]!.name).toBe('My Suite');
  });

  it('sets item path as filePath', async () => {
    const report = await buildBatchReport([makeItem({ path: '/projects/foo' })], NO_CONFIGURATION);
    expect(report.results.tests[0]!.filePath).toBe('/projects/foo');
  });

  it('computes duration from start/end timestamps', async () => {
    const report = await buildBatchReport([makeItem({ start: new Date(1000), end: new Date(3000) })], NO_CONFIGURATION);
    expect(report.results.tests[0]!.duration).toBe(2000);
  });

  it('sets summary counts correctly for mixed results', async () => {
    const items = [
      makeItem({ statusCode: 0 }),
      makeItem({ statusCode: 1 }),
      makeItem({ skipped: true, statusCode: 0 })
    ];
    const report = await buildBatchReport(items, NO_CONFIGURATION);
    const { summary } = report.results;
    expect(summary.tests).toBe(3);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(summary.pending).toBe(0);
    expect(summary.other).toBe(0);
  });

  it('sets summary start/stop from earliest/latest item timestamps', async () => {
    const items = [
      makeItem({ start: new Date(2000), end: new Date(5000) }),
      makeItem({ start: new Date(1000), end: new Date(7000) })
    ];
    const report = await buildBatchReport(items, NO_CONFIGURATION);
    const { summary } = report.results;
    expect(summary.start).toBe(1000);
    expect(summary.stop).toBe(7000);
    expect(summary.duration).toBe(6000);
  });

  it('returns an empty test list when given no items', async () => {
    const report = await buildBatchReport([], NO_CONFIGURATION);
    expect(report.results.tests).toHaveLength(0);
    expect(report.results.summary.tests).toBe(0);
  });

  it('uses fallback timestamps when start and end are undefined', async () => {
    const report = await buildBatchReport([makeItem({ start: undefined, end: undefined })], NO_CONFIGURATION);
    expect(report.results.summary.duration).toBe(0);
    expect(report.results.tests[0]!.duration).toBe(0);
  });
});
