import { FileSystem, Path, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';

type IstanbulSettings = {
  all?: boolean;
  sourceMap?: boolean;
  coverageGlobalScope?: string;
  coverageGlobalScopeFunc?: boolean;
  cwd?: string;
  include?: string[];
  exclude?: string[];
  [key: string]: unknown;
};

type SettingsEntry = {
  settings: IstanbulSettings;
  settingsPath: string;
};

export const getSettingsPath = async (configuration: Configuration): Promise<string> => {
  const { settingsPath } = await initSettings(configuration);
  return settingsPath;
};

export const getSettings = async (configuration: Configuration): Promise<IstanbulSettings> => {
  const { settings } = await initSettings(configuration);
  return settings;
};

// Settings are a pure function of the configuration (including runtime-stored testsuite filters, which
// are populated before the report step). They are regenerated and rewritten on each call — no caching —
// so the report reflects filters discovered after instrument().
export const initSettings = (configuration: Configuration): Promise<SettingsEntry> => _initSettings(configuration);

const _initSettings = async (configuration: Configuration): Promise<SettingsEntry> => {
  let base: IstanbulSettings = {};
  try {
    await FileSystem.access(configuration.coverageSettings, FileSystem.constants.R_OK);
    const raw = await FileSystem.readFile(configuration.coverageSettings, 'utf8');
    base = JSON.parse(raw) as IstanbulSettings;
    logger.debug({ source: 'coverage', message: `Loaded coverage settings from ${configuration.coverageSettings}` });
  } catch {
    logger.debug({ source: 'coverage', message: 'no coverage settings file found, using defaults' });
  }

  const exclude: string[] = [...(Array.isArray(base.exclude) ? base.exclude : [])];
  const sourceDirectory = configuration.coverageSourceDir || configuration.webapp;
  if (sourceDirectory) {
    const temporaryDirectoryRelative = Path.relative(sourceDirectory, configuration.coverageTempDir);
    const reportDirectoryRelative = Path.relative(sourceDirectory, configuration.coverageReportDir);
    const testReportDirectoryRelative = Path.relative(sourceDirectory, configuration.reportDir);
    exclude.push(
      `${temporaryDirectoryRelative}/**`,
      `${reportDirectoryRelative}/**`,
      `${testReportDirectoryRelative}/**`
    );
  }

  // Coverage filters come from the CLI/config options or from a testsuite (stored on runtime). CLI wins
  // when both are set. A testsuite populates runtime only after instrument(); since settings are no longer
  // cached, the report regenerates them with these globs.
  const coverageOnly = configuration.coverageOnly ?? configuration.runtime.coverageOnly;
  const coverageNever = configuration.coverageNever ?? configuration.runtime.coverageNever;

  if (coverageNever?.length) {
    for (const prefix of coverageNever) {
      exclude.push(`${prefix}**`);
    }
  }

  const baseInclude = Array.isArray(base.include) && base.include.length > 0 ? base.include : [];
  let include: string[] | undefined;
  if (coverageOnly?.length) {
    include = [...baseInclude, ...coverageOnly.map((prefix) => `${prefix}**`)];
  } else if (baseInclude.length > 0) {
    include = baseInclude;
  }

  // The nyc baseline (all:true enumerates every file at 0%) would resurrect filtered-out files via the
  // report merge. Suppress it whenever a coverage filter is active, from any source.
  const hasCoverageFilter = !!(coverageOnly?.length || coverageNever?.length);

  const settings: IstanbulSettings = {
    ...base,
    all: !hasCoverageFilter && base.all !== false,
    sourceMap: false,
    coverageGlobalScope: 'window.top',
    coverageGlobalScopeFunc: false,
    ...(sourceDirectory && { cwd: sourceDirectory }),
    ...(include !== undefined && { include }),
    exclude
  };

  const settingsDirectory = Path.join(configuration.coverageTempDir, 'settings');
  const settingsPath = Path.join(settingsDirectory, '.nycrc.json');
  await FileSystem.mkdir(settingsDirectory, { recursive: true });
  await FileSystem.writeFile(settingsPath, JSON.stringify(settings, undefined, 2));
  logger.debug({ source: 'coverage', message: `Coverage settings written to ${settingsPath}` });
  return { settings, settingsPath };
};
