import { Path, Process, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import { Folder } from '../../../utils/node/Folder.js';
import { getNycBin } from './nyc.js';
import { initSettings, getSettingsPath } from './settings.js';

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
      nycBin, 'instrument',
      '--nycrc-path', settingsPath,
      '--cwd', configuration.webapp,
      configuration.webapp, destinationDirectory
    ],
    { detached: true }
  );
  await proc.closed;
  if (proc.code !== 0) {
    throw new Error(`nyc instrument failed with code ${proc.code}`);
  }
  logger.info({ source: 'coverage', message: 'Instrumentation complete' });
};
