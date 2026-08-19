import { FileSystem, Path, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import type { IstanbulSettings } from './types.js';

interface SettingsEntry {
  settings: IstanbulSettings;
  settingsPath: string;
}

const cache = new WeakMap<Configuration, Promise<SettingsEntry>>();

export const getSettingsPath = async (configuration: Configuration): Promise<string> => {
  const { settingsPath } = await initSettings(configuration);
  return settingsPath;
};

export const getSettings = async (configuration: Configuration): Promise<IstanbulSettings> => {
  const { settings } = await initSettings(configuration);
  return settings;
};

export const initSettings = (configuration: Configuration): Promise<SettingsEntry> => {
  let promise = cache.get(configuration);
  if (!promise) {
    promise = _initSettings(configuration);
    cache.set(configuration, promise);
  }
  return promise;
};

const _initSettings = async (configuration: Configuration): Promise<SettingsEntry> => {
  let base: IstanbulSettings = {};
  try {
    await FileSystem.access(configuration.coverageSettings, FileSystem.constants.R_OK);
    const raw = await FileSystem.readFile(configuration.coverageSettings, 'utf8');
    base = JSON.parse(raw) as IstanbulSettings;
    logger.debug({ source: 'coverage', message: `Loaded coverage settings from ${configuration.coverageSettings}` });
  } catch {
    logger.debug({ source: 'coverage', message: 'No coverage settings file found, using defaults' });
  }

  const exclude: string[] = [...(Array.isArray(base.exclude) ? base.exclude : [])];
  const temporaryDirectoryRelative = Path.relative(configuration.webapp, configuration.coverageTempDir);
  const reportDirectoryRelative = Path.relative(configuration.webapp, configuration.coverageReportDir);
  const testReportDirectoryRelative = Path.relative(configuration.webapp, configuration.reportDir);
  exclude.push(
    `${temporaryDirectoryRelative}/**`,
    `${reportDirectoryRelative}/**`,
    `${testReportDirectoryRelative}/**`
  );

  const settings: IstanbulSettings = {
    ...base,
    all: base.all !== false,
    sourceMap: false,
    coverageGlobalScope: 'window.top',
    coverageGlobalScopeFunc: false,
    cwd: configuration.webapp,
    exclude
  };

  const settingsDirectory = Path.join(configuration.coverageTempDir, 'settings');
  const settingsPath = Path.join(settingsDirectory, '.nycrc.json');
  await FileSystem.mkdir(settingsDirectory, { recursive: true });
  await FileSystem.writeFile(settingsPath, JSON.stringify(settings, undefined, 2));
  logger.debug({ source: 'coverage', message: `Coverage settings written to ${settingsPath}` });
  return { settings, settingsPath };
};
