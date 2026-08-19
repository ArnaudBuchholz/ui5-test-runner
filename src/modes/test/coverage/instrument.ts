import { FileSystem, Host, Path, Process, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import { Folder } from '../../../utils/node/Folder.js';
import { getNycBin } from './nyc.js';
import { initSettings, getSettings, getSettingsPath } from './settings.js';

const MIN_BASELINE_FILE_SIZE = 5; // avoids empty {}

export const instrument = async (configuration: Configuration): Promise<void> => {
  logger.info({ source: 'coverage', message: 'Instrumenting source files...' });
  await Folder.recreate(configuration.coverageTempDir);
  await initSettings(configuration);

  const nycBin = await getNycBin(configuration);
  const settingsPath = getSettingsPath();
  const destinationDirectory = Path.join(configuration.coverageTempDir, 'instrumented');
  const proc = Process.spawn(
    'node',
    [
      nycBin,
      'instrument',
      '--nycrc-path',
      settingsPath,
      '--cwd',
      configuration.webapp,
      configuration.webapp,
      destinationDirectory
    ],
    { detached: true }
  );
  await proc.closed;
  if (proc.code !== 0) {
    throw new Error(`nyc instrument failed with code ${proc.code}`);
  }

  if (getSettings().all !== false) {
    // Use nyc itself to generate baseline coverage (all files at zero hits).
    const baselineTemporaryDirectory = Path.join(configuration.coverageTempDir, 'baseline');
    const baselineProc = Process.spawn(
      'node',
      [nycBin, '--nycrc-path', settingsPath, '--temp-dir', baselineTemporaryDirectory, Host.nodePath, '-e', ''],
      { detached: true }
    );
    await baselineProc.closed;
    if (baselineProc.code !== 0) {
      throw new Error(`nyc baseline generation failed with code ${baselineProc.code}`);
    }
    const baselineFiles = await FileSystem.readdir(baselineTemporaryDirectory, { withFileTypes: true });
    let baselineIndex = 0;
    for (const entry of baselineFiles) {
      if (!entry.isFile()) {
        continue;
      }
      const sourcePath = Path.join(baselineTemporaryDirectory, entry.name);
      const { size } = await FileSystem.stat(sourcePath);
      if (size <= MIN_BASELINE_FILE_SIZE) {
        continue;
      }
      const destinationName = baselineIndex === 0 ? 'baseline.json' : `baseline-${baselineIndex}.json`;
      await FileSystem.rename(sourcePath, Path.join(configuration.coverageTempDir, destinationName));
      ++baselineIndex;
    }
    await FileSystem.rm(baselineTemporaryDirectory, { recursive: true });
  }

  logger.info({ source: 'coverage', message: 'Instrumentation complete' });
};
