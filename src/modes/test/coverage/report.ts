import { FileSystem, Path, Process, Exit, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import { Folder } from '../../../utils/node/Folder.js';
import { getNycBin } from './nyc.js';
import { getSettingsPath } from './settings.js';

export const generateReport = async (configuration: Configuration): Promise<void> => {
  logger.info({ source: 'coverage', message: 'Generating coverage report...' });
  await Folder.recreate(configuration.coverageReportDir);

  // Merge per-page coverage files into a single object for nyc report
  const mergedDir = Path.join(configuration.coverageTempDir, 'merged');
  await Folder.create(mergedDir);
  const merged: Record<string, unknown> = {};
  const entries = await FileSystem.readdir(configuration.coverageTempDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const data = JSON.parse(
      await FileSystem.readFile(Path.join(configuration.coverageTempDir, entry.name), 'utf8')
    ) as Record<string, unknown>;
    Object.assign(merged, data);
  }
  const mergedPath = Path.join(mergedDir, 'coverage.json');
  await FileSystem.writeFile(mergedPath, JSON.stringify(merged));

  // Run nyc report
  const nycBin = await getNycBin(configuration);
  const settingsPath = getSettingsPath();
  const reporters = [...configuration.coverageReporters];
  if (!reporters.includes('text')) reporters.push('text');
  const reporterArgs = reporters.flatMap((r) => ['--reporter', r]);

  const proc = Process.spawn(
    'node',
    [
      nycBin, 'report',
      '--nycrc-path', settingsPath,
      '--temp-dir', mergedDir,
      '--report-dir', configuration.coverageReportDir,
      ...reporterArgs
    ],
    { detached: true, forceRender: true }
  );
  await proc.closed;
  if (proc.code !== 0) {
    throw new Error(`nyc report failed with code ${proc.code}`);
  }

  // Threshold checks via nyc check-coverage
  const checks: [string, number][] = [
    ['--branches', configuration.coverageCheckBranches],
    ['--functions', configuration.coverageCheckFunctions],
    ['--lines', configuration.coverageCheckLines],
    ['--statements', configuration.coverageCheckStatements]
  ];
  const thresholdArgs = checks.flatMap(([flag, value]) => (value > 0 ? [flag, String(value)] : []));
  if (thresholdArgs.length > 0) {
    const checkProc = Process.spawn(
      'node',
      [nycBin, 'check-coverage', '--nycrc-path', settingsPath, '--temp-dir', mergedDir, ...thresholdArgs],
      { detached: true }
    );
    await checkProc.closed;
    if (checkProc.code !== 0) {
      const thresholds = checks
        .filter(([, value]) => value > 0)
        .map(([flag, value]) => `${flag.replace('--', '')}=${value}%`)
        .join(', ');
      logger.error({ source: 'coverage', message: `Coverage thresholds not met (${thresholds})` });
      Exit.code = -1;
    }
  }

  logger.info({ source: 'coverage', message: 'Coverage report complete' });
};
