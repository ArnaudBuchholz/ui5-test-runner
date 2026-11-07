import { FileSystem, Host, Path, Process, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import type { CommonTestReport } from '../../../types/CommonTestReportFormat.js';
import { createEmptyTestResults } from '../../../types/CommonTestReportFormat.js';
import { Folder } from '../../../utils/node/Folder.js';
import { getNycBin } from './nyc.js';
import { getSettingsPath } from './settings.js';
import {
  getRecordedSuitePages,
  translateToCoverageFilter,
  isCoverageKeyKept,
  clearSuitePages
} from './coverageFilter.js';

// Apply the suite's coverage only/never filters to the merged coverage file. nyc report's own
// --include/--exclude do not re-filter already-collected entries (incl. the nyc --all baseline),
// so the filtering is done here on the merged file keys, made cwd-relative for matching.
const filterMergedCoverage = async (configuration: Configuration, mergedPath: string): Promise<void> => {
  const pages = getRecordedSuitePages(configuration);
  clearSuitePages(configuration);
  const filter = translateToCoverageFilter(pages);
  if (filter.include === undefined && filter.exclude.length === 0) {
    return;
  }
  const cwd = configuration.coverageSourceDir || configuration.webapp;
  const merged = JSON.parse(await FileSystem.readFile(mergedPath, 'utf8')) as Record<string, unknown>;
  const kept = Object.fromEntries(
    Object.entries(merged).filter(([key]) => isCoverageKeyKept(Path.relative(cwd, key), filter))
  );
  await FileSystem.writeFile(mergedPath, JSON.stringify(kept));
  logger.debug({
    source: 'coverage',
    message: `coverage filtered: ${Object.keys(merged).length} → ${Object.keys(kept).length} files`,
    data: { include: filter.include, exclude: filter.exclude }
  });
};

export const generateReport = async (
  configuration: Configuration
): Promise<CommonTestReport['results'] | undefined> => {
  logger.info({ source: 'coverage', message: 'generating coverage report...' });
  await Folder.recreate(configuration.coverageReportDir);

  const [nycBin, settingsPath] = await Promise.all([getNycBin(configuration), getSettingsPath(configuration)]);

  // Merge per-page coverage files using nyc merge
  const mergedDirectory = Path.join(configuration.coverageTempDir, 'merged');
  await Folder.create(mergedDirectory);
  const mergedPath = Path.join(mergedDirectory, 'coverage.json');
  const mergeProc = Process.spawn('node', [nycBin, 'merge', configuration.coverageTempDir, mergedPath], {
    detached: true
  });
  await mergeProc.closed;
  if (mergeProc.code !== 0) {
    throw new Error(`nyc merge failed with code ${mergeProc.code}`);
  }

  await filterMergedCoverage(configuration, mergedPath);

  const checks: [string, number][] = [
    ['--branches', configuration.coverageCheckBranches],
    ['--functions', configuration.coverageCheckFunctions],
    ['--lines', configuration.coverageCheckLines],
    ['--statements', configuration.coverageCheckStatements]
  ];
  const hasThresholds = checks.some(([, value]) => value > 0);
  // Always pass all four flags explicitly when --check-coverage is used: @istanbuljs/schema defaults
  // lines to 90, so omitting a flag would silently enforce a 90% threshold.
  const thresholdArguments = checks.flatMap(([flag, value]) => [flag, String(value)]);
  const checkCoverageArguments = hasThresholds ? ['--check-coverage', ...thresholdArguments] : [];

  // Run nyc report (with optional threshold checks via --check-coverage)
  const reporters = [...configuration.coverageReporters];
  if (!reporters.includes('text')) {
    reporters.push('text');
  }
  const reporterArguments = reporters.flatMap((r) => ['--reporter', r]);

  const proc = Process.spawn(
    'node',
    [
      nycBin,
      'report',
      '--nycrc-path',
      settingsPath,
      '--temp-dir',
      mergedDirectory,
      '--report-dir',
      configuration.coverageReportDir,
      ...reporterArguments,
      ...checkCoverageArguments
    ],
    { detached: true, forceRender: true, env: { ...Host.env, NODE_OPTIONS: '' } }
  );
  await proc.closed;
  if (proc.code !== 0) {
    if (checkCoverageArguments.length > 0) {
      const thresholds = checks
        .filter(([, value]) => value > 0)
        .map(([flag, value]) => `${flag.replace('--', '')}=${value}%`)
        .join(', ');
      logger.error({ source: 'coverage', message: `Coverage thresholds not met (${thresholds})` });
      logger.info({ source: 'coverage', message: 'coverage report complete' });
      const results = createEmptyTestResults();
      results.tool.name = 'nyc';
      results.summary.tests = 1;
      results.summary.failed = 1;
      results.tests.push({
        name: 'Global code coverage check',
        status: 'failed',
        duration: 0,
        message: `Coverage thresholds not met (${thresholds})`
      });
      return results;
    }
    throw new Error(`nyc report failed with code ${proc.code}`);
  }

  logger.info({ source: 'coverage', message: 'coverage report complete' });
  return undefined;
};
