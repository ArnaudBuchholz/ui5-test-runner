import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSystem, Path, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import { getSettingsPath, getSettings, initSettings } from './settings.js';

beforeEach(() => vi.clearAllMocks());

const COVERAGE_TEMP_DIR = '/tmp/coverage';
const COVERAGE_REPORT_DIR = '/tmp/coverage-report';
const REPORT_DIR = '/tmp/report';
const WEBAPP = '/app/webapp';

const BASE_CONFIGURATION = {
  coverageTempDir: COVERAGE_TEMP_DIR,
  coverageReportDir: COVERAGE_REPORT_DIR,
  reportDir: REPORT_DIR,
  webapp: WEBAPP
} as unknown as Configuration;

const NO_WEBAPP_CONFIGURATION = {
  coverageTempDir: COVERAGE_TEMP_DIR,
  coverageReportDir: COVERAGE_REPORT_DIR,
  reportDir: REPORT_DIR
} as unknown as Configuration;

const makeConfiguration = (overrides: object): Configuration => ({ ...BASE_CONFIGURATION, ...overrides });

describe('initSettings', () => {
  it('writes .nycrc.json into <coverageTempDir>/settings/', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative-path');
    const config = makeConfiguration({});
    await initSettings(config);
    const settingsPath = `${COVERAGE_TEMP_DIR}/settings/.nycrc.json`;
    expect(FileSystem.writeFile).toHaveBeenCalledWith(settingsPath, expect.any(String) as string);
  });

  it('creates the settings directory with recursive: true', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative-path');
    const config = makeConfiguration({});
    await initSettings(config);
    expect(FileSystem.mkdir).toHaveBeenCalledWith(`${COVERAGE_TEMP_DIR}/settings`, { recursive: true });
  });

  it('defaults all to true when coverageSettings file is missing', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative-path');
    const config = makeConfiguration({});
    const { settings } = await initSettings(config);
    expect(settings.all).toBe(true);
  });

  it('keeps all: false when base settings set all to false', async () => {
    vi.mocked(FileSystem.access).mockResolvedValue(undefined);
    vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ all: false }));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative-path');
    const config = makeConfiguration({});
    const { settings } = await initSettings(config);
    expect(settings.all).toBe(false);
  });

  it('sets sourceMap to false', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative-path');
    const config = makeConfiguration({});
    const { settings } = await initSettings(config);
    expect(settings.sourceMap).toBe(false);
  });

  it('sets coverageGlobalScope to "window.top"', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative-path');
    const config = makeConfiguration({});
    const { settings } = await initSettings(config);
    expect(settings.coverageGlobalScope).toBe('window.top');
  });

  it('sets coverageGlobalScopeFunc to false', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative-path');
    const config = makeConfiguration({});
    const { settings } = await initSettings(config);
    expect(settings.coverageGlobalScopeFunc).toBe(false);
  });

  it('sets cwd to webapp when no coverageSourceDir', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative-path');
    const config = makeConfiguration({});
    const { settings } = await initSettings(config);
    expect(settings.cwd).toBe(WEBAPP);
  });

  it('sets cwd to coverageSourceDir when provided', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative-path');
    const config = makeConfiguration({ coverageSourceDir: '/remote/src' });
    const { settings } = await initSettings(config);
    expect(settings.cwd).toBe('/remote/src');
  });

  it('omits cwd when neither webapp nor coverageSourceDir is set', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative-path');
    const { settings } = await initSettings(NO_WEBAPP_CONFIGURATION);
    expect(settings.cwd).toBeUndefined();
  });

  it('appends relative exclude paths for temp, report, and test report directories', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative)
      .mockReturnValueOnce('../coverage')
      .mockReturnValueOnce('../coverage-report')
      .mockReturnValueOnce('../report');
    const config = makeConfiguration({});
    const { settings } = await initSettings(config);
    expect(settings.exclude).toContain('../coverage/**');
    expect(settings.exclude).toContain('../coverage-report/**');
    expect(settings.exclude).toContain('../report/**');
  });

  it('merges base exclude list with computed excludes', async () => {
    vi.mocked(FileSystem.access).mockResolvedValue(undefined);
    vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ exclude: ['**/generated/**'] }));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative');
    const config = makeConfiguration({});
    const { settings } = await initSettings(config);
    expect(settings.exclude).toContain('**/generated/**');
  });

  it('loads base settings from coverageSettings file when accessible', async () => {
    vi.mocked(FileSystem.access).mockResolvedValue(undefined);
    vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ sourceMap: true, customKey: 'value' }));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative');
    const config = makeConfiguration({ coverageSettings: '/path/to/.nycrc.json' });
    const { settings } = await initSettings(config);
    expect(settings['customKey']).toBe('value');
  });

  it('logs debug when settings file is loaded', async () => {
    vi.mocked(FileSystem.access).mockResolvedValue(undefined);
    vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({}));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative');
    const config = makeConfiguration({ coverageSettings: '/path/to/.nycrc.json' });
    await initSettings(config);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'coverage',
        message: expect.stringContaining('Loaded coverage settings') as string
      })
    );
  });

  it('logs debug when no settings file is found', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative');
    const config = makeConfiguration({});
    await initSettings(config);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'coverage', message: 'No coverage settings file found, using defaults' })
    );
  });

  it('caches the result for the same configuration object', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative');
    const config = makeConfiguration({});
    const first = await initSettings(config);
    const second = await initSettings(config);
    expect(first).toBe(second);
  });
});

describe('getSettingsPath', () => {
  it('returns the settingsPath from initSettings', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative');
    const config = makeConfiguration({});
    const path = await getSettingsPath(config);
    expect(path).toBe(`${COVERAGE_TEMP_DIR}/settings/.nycrc.json`);
  });
});

describe('getSettings', () => {
  it('returns the settings object from initSettings', async () => {
    vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
    vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
    vi.mocked(Path.relative).mockReturnValue('relative');
    const config = makeConfiguration({});
    const settings = await getSettings(config);
    expect(settings.sourceMap).toBe(false);
    expect(settings.coverageGlobalScope).toBe('window.top');
  });
});
