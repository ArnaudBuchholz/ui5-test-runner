import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSystem, Host, Path, Process, logger } from '../../../platform/index.js';
import { Npm } from '../../../Npm.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import { Folder } from '../../../utils/node/Folder.js';
import { generateReport } from './report.js';

beforeEach(() => vi.clearAllMocks());

const COVERAGE_TEMP_DIR = '/tmp/coverage';
const COVERAGE_REPORT_DIR = '/tmp/coverage-report';
const NYC_BIN = '/node_modules/nyc/bin/nyc.js';
const SETTINGS_PATH = `${COVERAGE_TEMP_DIR}/settings/.nycrc.json`;

const makeProcess = (code: number) =>
  ({ code, closed: Promise.resolve() }) as unknown as InstanceType<typeof Process>;

const BASE_CONFIGURATION = {
  coverageTempDir: COVERAGE_TEMP_DIR,
  coverageReportDir: COVERAGE_REPORT_DIR,
  reportDir: '/tmp/report',
  webapp: '/app/webapp',
  coverageCheckBranches: 0,
  coverageCheckFunctions: 0,
  coverageCheckLines: 0,
  coverageCheckStatements: 0,
  coverageReporters: []
} as unknown as Configuration;

const makeConfiguration = (overrides: object): Configuration =>
  ({ ...BASE_CONFIGURATION, ...overrides });

const setupHappyPath = () => {
  vi.spyOn(Folder, 'recreate').mockResolvedValue(undefined);
  vi.spyOn(Folder, 'create').mockResolvedValue(undefined);
  vi.spyOn(Npm, 'import').mockResolvedValue(undefined);
  vi.spyOn(Npm, 'resolvePackageDir').mockResolvedValue('/node_modules/nyc');
  vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
  vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
  vi.mocked(Path.relative).mockReturnValue('relative');
  vi.mocked(Process.spawn).mockReturnValue(makeProcess(0));
};

describe('generateReport', () => {
  it('recreates coverageReportDir', async () => {
    setupHappyPath();
    await generateReport(BASE_CONFIGURATION);
    expect(Folder.recreate).toHaveBeenCalledWith(COVERAGE_REPORT_DIR);
  });

  it('logs that report generation is starting', async () => {
    setupHappyPath();
    await generateReport(BASE_CONFIGURATION);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'coverage', message: 'Generating coverage report...' })
    );
  });

  it('runs nyc merge on coverageTempDir', async () => {
    setupHappyPath();
    await generateReport(BASE_CONFIGURATION);
    expect(Process.spawn).toHaveBeenCalledWith(
      'node',
      expect.arrayContaining([NYC_BIN, 'merge', COVERAGE_TEMP_DIR]) as string[],
      expect.objectContaining({ detached: true })
    );
  });

  it('throws when nyc merge exits with non-zero code', async () => {
    setupHappyPath();
    vi.mocked(Process.spawn).mockReturnValueOnce(makeProcess(1));
    await expect(generateReport(BASE_CONFIGURATION)).rejects.toThrow('nyc merge failed with code 1');
  });

  it('runs nyc report with the merged directory', async () => {
    setupHappyPath();
    await generateReport(BASE_CONFIGURATION);
    expect(Process.spawn).toHaveBeenCalledWith(
      'node',
      expect.arrayContaining([NYC_BIN, 'report', '--nycrc-path', SETTINGS_PATH]) as string[],
      expect.objectContaining({ detached: true })
    );
  });

  it('always includes text reporter', async () => {
    setupHappyPath();
    await generateReport(BASE_CONFIGURATION);
    const reportCall = vi.mocked(Process.spawn).mock.calls.find(([, arguments_]) =>
      Array.isArray(arguments_) && arguments_.includes('report')
    );
    expect(reportCall?.[1]).toContain('text');
  });

  it('does not duplicate text reporter when already in coverageReporters', async () => {
    setupHappyPath();
    const config = makeConfiguration({ coverageReporters: ['text', 'html'] });
    await generateReport(config);
    const reportCall = vi.mocked(Process.spawn).mock.calls.find(([, arguments_]) =>
      Array.isArray(arguments_) && arguments_.includes('report')
    );
    const arguments_ = reportCall?.[1] ?? [];
    const textCount = arguments_.filter((a) => a === 'text').length;
    expect(textCount).toBe(1);
  });

  it('includes custom reporters alongside text', async () => {
    setupHappyPath();
    const config = makeConfiguration({ coverageReporters: ['html', 'lcov'] });
    await generateReport(config);
    const reportCall = vi.mocked(Process.spawn).mock.calls.find(([, arguments_]) =>
      Array.isArray(arguments_) && arguments_.includes('report')
    );
    expect(reportCall?.[1]).toContain('html');
    expect(reportCall?.[1]).toContain('lcov');
  });

  it('returns undefined on success', async () => {
    setupHappyPath();
    await expect(generateReport(BASE_CONFIGURATION)).resolves.toBeUndefined();
  });

  it('logs report complete on success', async () => {
    setupHappyPath();
    await generateReport(BASE_CONFIGURATION);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'coverage', message: 'Coverage report complete' })
    );
  });

  describe('when thresholds are set', () => {
    it('passes --check-coverage flag to nyc report', async () => {
      setupHappyPath();
      const config = makeConfiguration({ coverageCheckLines: 80 });
      await generateReport(config);
      const reportCall = vi.mocked(Process.spawn).mock.calls.find(([, arguments_]) =>
        Array.isArray(arguments_) && arguments_.includes('report')
      );
      expect(reportCall?.[1]).toContain('--check-coverage');
    });

    it('passes all four threshold flags even when only one is non-zero', async () => {
      setupHappyPath();
      const config = makeConfiguration({ coverageCheckLines: 80 });
      await generateReport(config);
      const reportCall = vi.mocked(Process.spawn).mock.calls.find(([, arguments_]) =>
        Array.isArray(arguments_) && arguments_.includes('report')
      );
      const arguments_ = reportCall?.[1] ?? [];
      expect(arguments_).toContain('--branches');
      expect(arguments_).toContain('--functions');
      expect(arguments_).toContain('--lines');
      expect(arguments_).toContain('--statements');
    });

    it('returns a failed test result when nyc report exits non-zero with thresholds', async () => {
      setupHappyPath();
      vi.mocked(Process.spawn)
        .mockReturnValueOnce(makeProcess(0)) // merge
        .mockReturnValueOnce(makeProcess(1)); // report
      const config = makeConfiguration({ coverageCheckLines: 80 });
      const result = await generateReport(config);
      expect(result).toBeDefined();
      expect(result?.summary.failed).toBe(1);
      expect(result?.tests[0]?.name).toBe('Global code coverage check');
      expect(result?.tests[0]?.status).toBe('failed');
    });

    it('logs error with threshold details when coverage check fails', async () => {
      setupHappyPath();
      vi.mocked(Process.spawn)
        .mockReturnValueOnce(makeProcess(0))
        .mockReturnValueOnce(makeProcess(1));
      const config = makeConfiguration({ coverageCheckLines: 80 });
      await generateReport(config);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'coverage',
          message: expect.stringContaining('Coverage thresholds not met') as string
        })
      );
    });

    it('sets tool name to "nyc" in the failed result', async () => {
      setupHappyPath();
      vi.mocked(Process.spawn)
        .mockReturnValueOnce(makeProcess(0))
        .mockReturnValueOnce(makeProcess(1));
      const config = makeConfiguration({ coverageCheckLines: 80 });
      const result = await generateReport(config);
      expect(result?.tool.name).toBe('nyc');
    });
  });

  describe('when no thresholds are set', () => {
    it('throws when nyc report exits with non-zero code', async () => {
      setupHappyPath();
      vi.mocked(Process.spawn)
        .mockReturnValueOnce(makeProcess(0)) // merge
        .mockReturnValueOnce(makeProcess(1)); // report
      await expect(generateReport(BASE_CONFIGURATION)).rejects.toThrow('nyc report failed with code 1');
    });

    it('does not pass --check-coverage flag', async () => {
      setupHappyPath();
      await generateReport(BASE_CONFIGURATION);
      const reportCall = vi.mocked(Process.spawn).mock.calls.find(([, arguments_]) =>
        Array.isArray(arguments_) && arguments_.includes('report')
      );
      expect(reportCall?.[1]).not.toContain('--check-coverage');
    });
  });

  it('passes NODE_OPTIONS="" in env to prevent interference with nyc report', async () => {
    setupHappyPath();
    vi.mocked(Host.env).mockReturnValue?.({});
    await generateReport(BASE_CONFIGURATION);
    const reportCall = vi.mocked(Process.spawn).mock.calls.find(([, arguments_]) =>
      Array.isArray(arguments_) && arguments_.includes('report')
    );
    expect(reportCall?.[2]).toMatchObject({ env: expect.objectContaining({ NODE_OPTIONS: '' }) as object });
  });
});
