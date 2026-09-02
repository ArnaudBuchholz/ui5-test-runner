import { it, expect, vi, beforeEach } from 'vitest';
import { FileSystem, Path } from '../platform/index.js';
import { generateHtmlReport } from './html.js';
import type { Configuration } from '../configuration/Configuration.js';
import type { CommonTestReport } from '../types/CommonTestReportFormat.js';

const NO_CONFIGURATION = { reportDir: '/output' } as unknown as Configuration;

const EMPTY_REPORT: CommonTestReport = {
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
};

beforeEach(() => {
  vi.mocked(FileSystem.readFile).mockResolvedValue('/* js content */');
  vi.mocked(FileSystem.writeFileSync).mockImplementation(() => {});
});

it('reads library and report JS then writes the HTML file', async () => {
  await generateHtmlReport(NO_CONFIGURATION, EMPTY_REPORT);
  expect(FileSystem.readFile).toHaveBeenCalledTimes(2);
  expect(FileSystem.writeFileSync).toHaveBeenCalledOnce();
  const [writtenPath, writtenContent] = vi.mocked(FileSystem.writeFileSync).mock.calls[0]!;
  expect(writtenPath).toBe(Path.join('/output', 'report.html'));
  expect(writtenContent).toContain('<!DOCTYPE html>');
  expect(writtenContent).toContain(JSON.stringify(EMPTY_REPORT));
  expect(writtenContent).toContain('/* js content */');
});
