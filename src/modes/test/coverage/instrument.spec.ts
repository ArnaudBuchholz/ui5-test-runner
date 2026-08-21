import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSystem, Path, Process, logger } from '../../../platform/index.js';
import { Npm } from '../../../Npm.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import { Folder } from '../../../utils/node/Folder.js';
import { instrument } from './instrument.js';

beforeEach(() => vi.clearAllMocks());

const COVERAGE_TEMP_DIR = '/tmp/coverage';
const WEBAPP = '/app/webapp';
const NYC_BIN = '/node_modules/nyc/bin/nyc.js';
const SETTINGS_PATH = `${COVERAGE_TEMP_DIR}/settings/.nycrc.json`;

const makeProcess = (code: number) =>
  ({ code, closed: Promise.resolve() }) as unknown as InstanceType<typeof Process>;

const BASE_CONFIGURATION = {
  coverageTempDir: COVERAGE_TEMP_DIR,
  coverageReportDir: '/tmp/coverage-report',
  reportDir: '/tmp/report',
  webapp: WEBAPP
} as unknown as Configuration;

const makeConfiguration = (overrides: object): Configuration =>
  ({ ...BASE_CONFIGURATION, ...overrides });

const setupHappyPath = () => {
  vi.spyOn(Folder, 'recreate').mockResolvedValue(undefined);
  vi.spyOn(Folder, 'create').mockResolvedValue(undefined);
  vi.spyOn(Npm, 'import').mockResolvedValue(undefined);
  vi.spyOn(Npm, 'resolvePackageDir').mockResolvedValue('/node_modules/nyc');
  vi.mocked(FileSystem.access).mockRejectedValue(new Error('not found'));
  vi.mocked(FileSystem.readdir).mockResolvedValue([]);
  vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
  vi.mocked(Path.relative).mockReturnValue('relative');
  vi.mocked(Process.spawn).mockReturnValue(makeProcess(0));
};

describe('instrument', () => {
  it('recreates coverageTempDir before doing anything else', async () => {
    setupHappyPath();
    vi.mocked(Process.spawn).mockReturnValue(makeProcess(0));
    const config = makeConfiguration({});
    await instrument(config);
    expect(Folder.recreate).toHaveBeenCalledWith(COVERAGE_TEMP_DIR);
  });

  describe('when coverageSourceDir is set', () => {
    it('logs that local instrumentation is skipped', async () => {
      setupHappyPath();
      const config = makeConfiguration({ coverageSourceDir: '/remote/src' });
      await instrument(config);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'coverage',
          message: 'coverageSourceDir is set, skipping local instrumentation'
        })
      );
    });

    it('does not spawn nyc instrument', async () => {
      setupHappyPath();
      const config = makeConfiguration({ coverageSourceDir: '/remote/src' });
      await instrument(config);
      expect(Process.spawn).not.toHaveBeenCalledWith(
        'node',
        expect.arrayContaining(['instrument']) as string[],
        expect.anything()
      );
    });
  });

  describe('when webapp is not set', () => {
    it('logs that instrumentation is skipped', async () => {
      setupHappyPath();
      const config = makeConfiguration({ webapp: undefined });
      await instrument(config);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'coverage',
          message: 'No local webapp, skipping instrumentation'
        })
      );
    });

    it('does not spawn any process', async () => {
      setupHappyPath();
      const config = makeConfiguration({ webapp: undefined });
      await instrument(config);
      expect(Process.spawn).not.toHaveBeenCalled();
    });
  });

  describe('with webapp and no coverageSourceDir', () => {
    it('logs that instrumentation is starting', async () => {
      setupHappyPath();
      const config = makeConfiguration({});
      await instrument(config);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'coverage', message: 'Instrumenting source files...' })
      );
    });

    it('spawns nyc instrument with correct arguments', async () => {
      setupHappyPath();
      vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
      const config = makeConfiguration({});
      await instrument(config);
      expect(Process.spawn).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([NYC_BIN, 'instrument', '--nycrc-path', SETTINGS_PATH, '--cwd', WEBAPP, WEBAPP]) as string[],
        expect.objectContaining({ detached: true })
      );
    });

    it('throws when nyc instrument exits with non-zero code', async () => {
      setupHappyPath();
      vi.mocked(Process.spawn).mockReturnValueOnce(makeProcess(1));
      const config = makeConfiguration({});
      await expect(instrument(config)).rejects.toThrow('nyc instrument failed with code 1');
    });

    it('logs instrumentation complete on success', async () => {
      setupHappyPath();
      const config = makeConfiguration({});
      await instrument(config);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'coverage', message: 'Instrumentation complete' })
      );
    });
  });

  describe('generateBaseline', () => {
    it('spawns nyc with --temp-dir to generate baseline', async () => {
      setupHappyPath();
      vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
      const config = makeConfiguration({});
      await instrument(config);
      expect(Process.spawn).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([NYC_BIN, '--nycrc-path', SETTINGS_PATH, '--temp-dir']) as string[],
        expect.objectContaining({ detached: true })
      );
    });

    it('throws when baseline generation exits with non-zero code', async () => {
      setupHappyPath();
      vi.mocked(Process.spawn)
        .mockReturnValueOnce(makeProcess(0)) // instrument
        .mockReturnValueOnce(makeProcess(2)); // baseline
      const config = makeConfiguration({});
      await expect(instrument(config)).rejects.toThrow('nyc baseline generation failed with code 2');
    });

    it('moves baseline files larger than 5 bytes to coverageTempDir', async () => {
      setupHappyPath();
      vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
      const fakeEntry = { isFile: () => true, name: 'abc.json' } as unknown as Awaited<
        ReturnType<typeof FileSystem.readdir>
      >[number];
      vi.mocked(FileSystem.readdir).mockResolvedValue([fakeEntry]);
      vi.mocked(FileSystem.stat).mockResolvedValue({ size: 100 } as Awaited<ReturnType<typeof FileSystem.stat>>);
      const config = makeConfiguration({});
      await instrument(config);
      expect(FileSystem.rename).toHaveBeenCalledWith(
        `${COVERAGE_TEMP_DIR}/baseline/abc.json`,
        `${COVERAGE_TEMP_DIR}/baseline.json`
      );
    });

    it('skips baseline files with size <= 5 bytes', async () => {
      setupHappyPath();
      vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
      const fakeEntry = { isFile: () => true, name: 'empty.json' } as unknown as Awaited<
        ReturnType<typeof FileSystem.readdir>
      >[number];
      vi.mocked(FileSystem.readdir).mockResolvedValue([fakeEntry]);
      vi.mocked(FileSystem.stat).mockResolvedValue({ size: 2 } as Awaited<ReturnType<typeof FileSystem.stat>>);
      const config = makeConfiguration({});
      await instrument(config);
      expect(FileSystem.rename).not.toHaveBeenCalled();
    });

    it('names subsequent baseline files with an index suffix', async () => {
      setupHappyPath();
      vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
      const makeEntry = (name: string) =>
        ({ isFile: () => true, name }) as unknown as Awaited<ReturnType<typeof FileSystem.readdir>>[number];
      vi.mocked(FileSystem.readdir).mockResolvedValue([makeEntry('a.json'), makeEntry('b.json')]);
      vi.mocked(FileSystem.stat).mockResolvedValue({ size: 100 } as Awaited<ReturnType<typeof FileSystem.stat>>);
      const config = makeConfiguration({});
      await instrument(config);
      expect(FileSystem.rename).toHaveBeenCalledWith(
        `${COVERAGE_TEMP_DIR}/baseline/b.json`,
        `${COVERAGE_TEMP_DIR}/baseline-1.json`
      );
    });

    it('removes the baseline temp directory after moving files', async () => {
      setupHappyPath();
      vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
      const config = makeConfiguration({});
      await instrument(config);
      expect(FileSystem.rm).toHaveBeenCalledWith(`${COVERAGE_TEMP_DIR}/baseline`, { recursive: true });
    });

    it('skips baseline generation when settings.all is false', async () => {
      vi.spyOn(Folder, 'recreate').mockResolvedValue(undefined);
      vi.spyOn(Npm, 'import').mockResolvedValue(undefined);
      vi.spyOn(Npm, 'resolvePackageDir').mockResolvedValue('/node_modules/nyc');
      vi.mocked(FileSystem.access).mockResolvedValue(undefined);
      vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ all: false }));
      vi.mocked(Path.join).mockImplementation((...parts) => parts.join('/'));
      vi.mocked(Path.relative).mockReturnValue('relative');
      vi.mocked(Process.spawn).mockReturnValue(makeProcess(0));
      const config = makeConfiguration({});
      await instrument(config);
      // only instrument spawn, no baseline spawn
      const spawnCalls = vi.mocked(Process.spawn).mock.calls;
      const baselineCalls = spawnCalls.filter(
        ([, arguments_]) => Array.isArray(arguments_) && arguments_.includes('--temp-dir')
      );
      expect(baselineCalls).toHaveLength(0);
    });
  });
});
