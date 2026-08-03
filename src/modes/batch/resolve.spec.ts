import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSystem, logger } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { resolve } from './resolve.js';

vi.mock('../../platform/mock.js');

const CWD = '/test/cwd';

const config = (batch: string[]): Configuration => ({ cwd: CWD, batch, sources: {} }) as unknown as Configuration;

type FileSystemStat = Awaited<ReturnType<typeof FileSystem.stat>>;
const makeStatDirectory = () => ({ isDirectory: () => true, isFile: () => false }) as FileSystemStat;
const makeStatFile = () => ({ isDirectory: () => false, isFile: () => true }) as FileSystemStat;
const makeStatOther = () => ({ isDirectory: () => false, isFile: () => false }) as FileSystemStat;

type FileSystemReadir = Awaited<ReturnType<typeof FileSystem.readdir>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(FileSystem.readFile).mockResolvedValue('{}');
});

describe('resolve', () => {
  describe('folder()', () => {
    it('adds a batch item with --cwd arg when spec is a directory', async () => {
      vi.mocked(FileSystem.stat).mockResolvedValue(makeStatDirectory());
      const items = await resolve(config(['/some/folder']));
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        path: '/some/folder',
        args: ['--cwd', '/some/folder']
      });
    });

    it('uses basename as id and label', async () => {
      vi.mocked(FileSystem.stat).mockResolvedValue(makeStatDirectory());
      const items = await resolve(config(['/some/my-project']));
      expect(items[0]!.id).toBe('my-project');
      expect(items[0]!.label).toBe('my-project');
    });
  });

  describe('configurationFile()', () => {
    it('adds a batch item with --config arg when spec is a .json file', async () => {
      vi.mocked(FileSystem.stat).mockResolvedValue(makeStatFile());
      const items = await resolve(config(['/some/config.json']));
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        path: '/some/config.json',
        args: ['--config', '/some/config.json']
      });
    });

    it('uses batchId and batchLabel from the JSON file when present', async () => {
      vi.mocked(FileSystem.stat).mockResolvedValue(makeStatFile());
      vi.mocked(FileSystem.readFile).mockResolvedValue(
        JSON.stringify({ batchId: 'custom-id', batchLabel: 'Custom Label' })
      );
      const items = await resolve(config(['/some/config.json']));
      expect(items[0]!.id).toBe('custom-id');
      expect(items[0]!.label).toBe('Custom Label');
    });

    it('falls back to basename for id and label when batchId/batchLabel are absent', async () => {
      vi.mocked(FileSystem.stat).mockResolvedValue(makeStatFile());
      vi.mocked(FileSystem.readFile).mockResolvedValue('{}');
      const items = await resolve(config(['/some/JS_LEGACY.json']));
      expect(items[0]!.label).toBe('JS_LEGACY.json');
    });

    it('logs a warning and skips when readFile throws (invalid JSON)', async () => {
      vi.mocked(FileSystem.stat).mockResolvedValue(makeStatFile());
      vi.mocked(FileSystem.readFile).mockRejectedValue(new Error('JSON parse error'));
      const items = await resolve(config(['/some/bad.json']));
      expect(items).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reason: 'invalid JSON configuration file' }) as unknown
        })
      );
    });

    it('logs a warning and skips when JSON.parse fails', async () => {
      vi.mocked(FileSystem.stat).mockResolvedValue(makeStatFile());
      vi.mocked(FileSystem.readFile).mockResolvedValue('not valid json {{{');
      const items = await resolve(config(['/some/bad.json']));
      expect(items).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ reason: 'invalid JSON configuration file' }) as unknown
        })
      );
    });
  });

  describe('unsupported file type', () => {
    it('logs a warning when the path exists but is neither folder nor .json', async () => {
      vi.mocked(FileSystem.stat).mockResolvedValue(makeStatOther());
      const items = await resolve(config(['/some/file.txt']));
      expect(items).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reason: 'only folders and JSON configuration files are supported'
          }) as unknown
        })
      );
    });
  });

  describe('regex scan', () => {
    it('matches directories and adds them as folder items', async () => {
      vi.mocked(FileSystem.stat).mockRejectedValueOnce(new Error('ENOENT')).mockResolvedValue(makeStatDirectory());
      vi.mocked(FileSystem.readdir).mockResolvedValue(['my-project'] as unknown as Awaited<
        ReturnType<typeof FileSystem.readdir>
      >);
      const items = await resolve(config(['my-project']));
      expect(items).toHaveLength(1);
      expect(items[0]!.args[0]).toBe('--cwd');
    });

    it('matches .json files and adds them as config items', async () => {
      vi.mocked(FileSystem.stat).mockRejectedValueOnce(new Error('ENOENT')).mockResolvedValue(makeStatFile());
      vi.mocked(FileSystem.readdir).mockResolvedValue(['app.json'] as unknown as Awaited<
        ReturnType<typeof FileSystem.readdir>
      >);
      const items = await resolve(config([String.raw`app\.json`]));
      expect(items[0]!.args[0]).toBe('--config');
    });

    it(String.raw`normalizes Windows paths (replaces \\ with /) before testing regex`, async () => {
      vi.mocked(FileSystem.stat).mockRejectedValueOnce(new Error('ENOENT')).mockResolvedValue(makeStatDirectory());
      vi.mocked(FileSystem.readdir).mockResolvedValue(['my-app'] as unknown as Awaited<
        ReturnType<typeof FileSystem.readdir>
      >);
      const items = await resolve(config(['my-app']));
      expect(items).toHaveLength(1);
    });

    it('returns no items and no warning when regex matches nothing', async () => {
      vi.mocked(FileSystem.stat).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(FileSystem.readdir).mockResolvedValue([]);
      const items = await resolve(config(['no-match-at-all']));
      expect(items).toHaveLength(0);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('logs a warning and skips when the spec is an invalid regular expression', async () => {
      vi.mocked(FileSystem.stat).mockRejectedValue(new Error('ENOENT'));
      const items = await resolve(config(['[invalid']));
      expect(items).toHaveLength(0);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ reason: 'invalid regular expression' }) as unknown })
      );
    });

    it('does not match files nested under a subdirectory that would match from a worktree path', async () => {
      // Simulates: cwd has .claude/worktrees/branch/test/e2e/app.json
      // The regex test/e2e/[\w_]*\.json must NOT match because 'test/e2e' is not at cwd root
      vi.mocked(FileSystem.stat)
        .mockRejectedValueOnce(new Error('ENOENT')) // spec is not a direct path
        .mockResolvedValueOnce(makeStatDirectory()) // .claude
        .mockResolvedValueOnce(makeStatDirectory()) // .claude/worktrees
        .mockResolvedValueOnce(makeStatDirectory()) // .claude/worktrees/branch
        .mockResolvedValueOnce(makeStatDirectory()) // .claude/worktrees/branch/test
        .mockResolvedValueOnce(makeStatDirectory()) // .claude/worktrees/branch/test/e2e
        .mockResolvedValueOnce(makeStatFile()); // .claude/worktrees/branch/test/e2e/app.json
      vi.mocked(FileSystem.readdir)
        .mockResolvedValueOnce(['.claude'] as unknown as FileSystemReadir)
        .mockResolvedValueOnce(['worktrees'] as unknown as FileSystemReadir)
        .mockResolvedValueOnce(['branch'] as unknown as FileSystemReadir)
        .mockResolvedValueOnce(['test'] as unknown as FileSystemReadir)
        .mockResolvedValueOnce(['e2e'] as unknown as FileSystemReadir)
        .mockResolvedValueOnce(['app.json'] as unknown as FileSystemReadir);
      const items = await resolve(config([String.raw`^test/e2e/[\w_]*\.json`]));
      expect(items).toHaveLength(0);
    });
  });

  describe('relative path', () => {
    it('resolves relative spec paths against configuration.cwd', async () => {
      vi.mocked(FileSystem.stat).mockResolvedValue(makeStatDirectory());
      const items = await resolve(config(['sub/folder']));
      expect(items[0]!.path).toBe(`${CWD}/sub/folder`);
    });
  });
});
