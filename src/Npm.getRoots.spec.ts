import { it, expect, describe, vi, beforeEach } from 'vitest';
import { Process } from './platform/Process.js';
import { FileSystem } from './platform/FileSystem.js';
import { logger } from './platform/logger.js';
import { ExitShutdownError } from './platform/Exit.js';
import type { Configuration } from './configuration/Configuration.js';

const CWD = '/test/cwd';
const NO_CONFIGURATION = { cwd: CWD } as unknown as Configuration;

const LOCAL_ROOT = '/local/root';
const GLOBAL_ROOT = '/global/root';

type ProcessLike = { stdout: string; code: number; closed: Promise<void> };

const makeProcess = (stdout: string, code = 0): ProcessLike => ({ stdout, code, closed: Promise.resolve() });

const errnoError = (code: string): NodeJS.ErrnoException => Object.assign(new Error(code), { code });

const npmCliProcess = makeProcess('npm@10.0.0 /usr/local/lib/node_modules/npm');

const setupRoots = (localStdout: string, globalStdout: string, localCode = 0, globalCode = 0) => {
  vi.mocked(Process.spawn)
    // getNpmCliPath: the first `npm('root')` call warms the memoizedNpmCliPath
    .mockImplementationOnce(() => npmCliProcess as never)
    // npm root (local)
    .mockImplementationOnce(() => makeProcess(localStdout, localCode) as never)
    // npm root --global (memoizedNpmCliPath is already cached; only the spawn call)
    .mockImplementationOnce(() => makeProcess(globalStdout, globalCode) as never);
};

const loadFreshNpm = async () => {
  vi.resetModules();
  const { Npm } = await import('./Npm.js');
  return Npm;
};

describe('getRoots validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects with a descriptive error when npm root exits non-zero for local', async () => {
    setupRoots(LOCAL_ROOT, GLOBAL_ROOT, 1, 0);
    const Npm = await loadFreshNpm();
    await expect(Npm.resolvePackageDir(NO_CONFIGURATION, 'any-module')).rejects.toThrow(ExitShutdownError);
    expect(logger.fatal).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'npm root (local) failed with code 1' })
    );
  });

  it('rejects with a descriptive error when npm root exits non-zero for global', async () => {
    setupRoots(LOCAL_ROOT, GLOBAL_ROOT, 0, 2);
    const Npm = await loadFreshNpm();
    await expect(Npm.resolvePackageDir(NO_CONFIGURATION, 'any-module')).rejects.toThrow(ExitShutdownError);
    expect(logger.fatal).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'npm root (global) failed with code 2' })
    );
  });

  it('rejects with a descriptive error when npm root returns an empty path', async () => {
    setupRoots('', GLOBAL_ROOT);
    const Npm = await loadFreshNpm();
    await expect(Npm.resolvePackageDir(NO_CONFIGURATION, 'any-module')).rejects.toThrow(ExitShutdownError);
    expect(logger.fatal).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'npm root (local) returned an invalid path: ""' })
    );
  });

  it('rejects when the local root directory is genuinely unreadable (EACCES)', async () => {
    setupRoots(LOCAL_ROOT, GLOBAL_ROOT);
    vi.mocked(FileSystem.access).mockRejectedValueOnce(errnoError('EACCES'));
    const Npm = await loadFreshNpm();
    await expect(Npm.resolvePackageDir(NO_CONFIGURATION, 'any-module')).rejects.toThrow(ExitShutdownError);
    expect(logger.fatal).toHaveBeenCalledWith(
      expect.objectContaining({ message: `npm root (local) directory is not accessible: "${LOCAL_ROOT}"` })
    );
  });

  it('tolerates a missing local root directory (ENOENT) and proceeds', async () => {
    // `npm root` reports where node_modules would live even when it does not exist yet; a missing
    // local root is a normal state (nothing installed locally) and must not abort the run.
    setupRoots(LOCAL_ROOT, GLOBAL_ROOT);
    vi.mocked(FileSystem.access).mockRejectedValueOnce(errnoError('ENOENT'));
    const Npm = await loadFreshNpm();
    // Neither root resolves the module, so we expect the normal "cannot locate" path — not a fatal.
    await expect(Npm.resolvePackageDir(NO_CONFIGURATION, 'any-module')).rejects.toThrow(
      'Cannot locate package directory for any-module'
    );
    expect(logger.fatal).not.toHaveBeenCalled();
  });

  it('rejects when the global root directory is missing (ENOENT is not tolerated for global)', async () => {
    setupRoots(LOCAL_ROOT, GLOBAL_ROOT);
    // First access (local) succeeds, second access (global) is missing.
    vi.mocked(FileSystem.access).mockResolvedValueOnce(undefined).mockRejectedValueOnce(errnoError('ENOENT'));
    const Npm = await loadFreshNpm();
    await expect(Npm.resolvePackageDir(NO_CONFIGURATION, 'any-module')).rejects.toThrow(ExitShutdownError);
    expect(logger.fatal).toHaveBeenCalledWith(
      expect.objectContaining({ message: `npm root (global) directory is not accessible: "${GLOBAL_ROOT}"` })
    );
  });
});
