import { FileSystem, Host, Path, Process, assert, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import { Folder } from '../../../utils/node/Folder.js';
import { getNycBin } from './nyc.js';
import { initSettings } from './settings.js';

const MIN_BASELINE_FILE_SIZE = 5; // avoids empty {}

export const instrument = async (configuration: Configuration): Promise<void> => {
  await Folder.recreate(configuration.coverageTempDir);
  if (configuration.coverageSourceDir) {
    logger.info({ source: 'coverage', message: 'coverageSourceDir is set, skipping local instrumentation' });
    await generateBaseline(configuration);
    return;
  }
  if (!configuration.webapp) {
    logger.info({ source: 'coverage', message: 'No local webapp, skipping instrumentation' });
    return;
  }
  logger.info({ source: 'coverage', message: 'Instrumenting source files...' });
  const { settings, settingsPath } = await initSettings(configuration);

  const nycBin = await getNycBin(configuration);
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
  assert(proc.code === 0, `nyc instrument failed with code ${proc.code}`);

  if (settings.all !== false) {
    await generateBaseline(configuration);
  }

  logger.info({ source: 'coverage', message: 'Instrumentation complete' });
};

const generateBaseline = async (configuration: Configuration): Promise<void> => {
  const { settings, settingsPath } = await initSettings(configuration);
  if (settings.all === false) {
    return;
  }
  const nycBin = await getNycBin(configuration);
  const baselineTemporaryDirectory = Path.join(configuration.coverageTempDir, 'baseline');
  const baselineProc = Process.spawn(
    'node',
    [nycBin, '--nycrc-path', settingsPath, '--temp-dir', baselineTemporaryDirectory, Host.nodePath, '-e', ''],
    { detached: true }
  );
  await baselineProc.closed;
  assert(baselineProc.code === 0, `nyc baseline generation failed with code ${baselineProc.code}`);
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
};
