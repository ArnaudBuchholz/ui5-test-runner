import { FileSystem, Path, Process, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import { Folder } from '../../../utils/node/Folder.js';
import { getNycBin } from './nyc.js';
import { initSettings, getSettingsPath } from './settings.js';

const COVERAGE_DATA_PATTERN = /var coverageData=(\{.*?\});var coverage=/s;

const extractBaseline = async (baselines: Record<string, unknown>, directory: string): Promise<void> => {
  const entries = await FileSystem.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = Path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await extractBaseline(baselines, fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const source = await FileSystem.readFile(fullPath, 'utf8');
      const match = COVERAGE_DATA_PATTERN.exec(source);
      if (match) {
        const data = (0, eval)(`(${match[1]})`) as { path: string };
        baselines[data.path] = data;
      }
    }
  }
};

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

  const baselines: Record<string, unknown> = {};
  await extractBaseline(baselines, destinationDirectory);
  await FileSystem.writeFile(Path.join(configuration.coverageTempDir, 'baselines.json'), JSON.stringify(baselines));

  logger.info({ source: 'coverage', message: 'Instrumentation complete' });
};
