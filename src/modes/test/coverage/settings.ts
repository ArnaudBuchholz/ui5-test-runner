import { FileSystem, Path, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import type { IstanbulSettings } from './types.js';

let _settings: IstanbulSettings | undefined;
let _settingsPath: string | undefined;

export const getSettingsPath = (): string => {
  if (_settingsPath === undefined) {
    throw new Error('Coverage settings not initialized');
  }
  return _settingsPath;
};

export const getSettings = (): IstanbulSettings => {
  if (_settings === undefined) {
    throw new Error('Coverage settings not initialized');
  }
  return _settings;
};

export const initSettings = async (configuration: Configuration): Promise<IstanbulSettings> => {
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
  const tempDirRelative = Path.relative(configuration.webapp, configuration.coverageTempDir);
  const reportDirRelative = Path.relative(configuration.webapp, configuration.coverageReportDir);
  const testReportDirRelative = Path.relative(configuration.webapp, configuration.reportDir);
  exclude.push(
    `${tempDirRelative}/**`,
    `${reportDirRelative}/**`,
    `${testReportDirRelative}/**`
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

  const settingsDir = Path.join(configuration.coverageTempDir, 'settings');
  _settingsPath = Path.join(settingsDir, '.nycrc.json');
  await FileSystem.mkdir(settingsDir, { recursive: true });
  await FileSystem.writeFile(_settingsPath, JSON.stringify(settings, undefined, 2));
  _settings = settings;
  logger.debug({ source: 'coverage', message: `Coverage settings written to ${_settingsPath}` });
  return settings;
};
