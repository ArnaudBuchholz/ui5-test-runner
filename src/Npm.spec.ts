import { it, expect, vi, beforeEach, describe } from 'vitest';
import { Http } from './platform/Http.js';
import { FileSystem } from './platform/FileSystem.js';
import { Process } from './platform/Process.js';
import { logger } from './platform/logger.js';
import type { Configuration } from './configuration/Configuration.js';
import { getNpmCliPath, Npm } from './Npm.js';

const NO_CONFIGURATION = {} as unknown as Configuration;

const makeProcess = (stdout: string) =>
  ({ stdout, closed: Promise.resolve() }) as unknown as InstanceType<typeof Process>;

// Set up Process.spawn before tests run so the memoized getNpmCliPath and getRoots
// resolve correctly on their first (and only) invocation.
vi.mocked(Process.spawn).mockImplementation((command, arguments_) => {
  if (command === 'npm') {
    return makeProcess('npm@10.0.0 /usr/local/lib/node_modules/npm');
  }
  return makeProcess((arguments_ ?? []).includes('--global') ? '/global/root' : '/local/root');
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getNpmCliPath', () => {
  it('returns the npm-cli.js path on success', async () => {
    vi.mocked(Process.spawn).mockImplementationOnce(() => makeProcess('npm@10.2.0 /usr/local/lib/node_modules/npm'));
    await expect(getNpmCliPath()).resolves.toBe('/usr/local/lib/node_modules/npm/bin/npm-cli.js');
  });

  it('throws and logs fatal when npm output does not match the expected format', async () => {
    vi.mocked(Process.spawn).mockImplementationOnce(() => makeProcess('unexpected output'));
    await expect(getNpmCliPath()).rejects.toThrow('Unable to initialize NPM');
    expect(logger.fatal).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unable to match NPM output' }));
  });

  it('throws and logs fatal when the parsed path is empty', async () => {
    vi.mocked(Process.spawn).mockImplementationOnce(() => makeProcess('npm@10.2.0 '));
    await expect(getNpmCliPath()).rejects.toThrow('Unable to initialize NPM');
    expect(logger.fatal).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to parse NPM output' }));
  });
});

describe('getLatestVersion', () => {
  it('returns the version from the NPM registry', async () => {
    vi.mocked(Http.get).mockResolvedValue(JSON.stringify({ version: '2.3.4' }));
    await expect(Npm.getLatestVersion('some-module')).resolves.toBe('2.3.4');
    expect(Http.get).toHaveBeenCalledWith('https://registry.npmjs.org/some-module/latest');
  });

  it('wraps HTTP errors with a descriptive message', async () => {
    vi.mocked(Http.get).mockRejectedValue(new Error('Network error'));
    await expect(Npm.getLatestVersion('some-module')).rejects.toThrow(
      'Unable to fetch latest version of some-module from NPM registry'
    );
  });
});

describe('checkIfLatestVersion', () => {
  it('does not warn when the installed version is up to date', async () => {
    vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));
    vi.mocked(Http.get).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));
    await Npm.checkIfLatestVersion('some-module', true);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns with [PKGVRS] when a newer version is available', async () => {
    vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));
    vi.mocked(Http.get).mockResolvedValue(JSON.stringify({ version: '2.0.0' }));
    await Npm.checkIfLatestVersion('some-module', true);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('[PKGVRS]') as string })
    );
  });

  it('reads package.json from the local root when isLocal is true', async () => {
    vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));
    vi.mocked(Http.get).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));
    await Npm.checkIfLatestVersion('some-module', true);
    expect(FileSystem.readFile).toHaveBeenCalledWith('/local/root/some-module/package.json', 'utf8');
  });

  it('reads package.json from the global root when isLocal is false', async () => {
    vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));
    vi.mocked(Http.get).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));
    await Npm.checkIfLatestVersion('some-module', false);
    expect(FileSystem.readFile).toHaveBeenCalledWith('/global/root/some-module/package.json', 'utf8');
  });

  it('swallows errors and reports them via logger.error', async () => {
    vi.mocked(FileSystem.readFile).mockRejectedValue(new Error('File not found'));
    await expect(Npm.checkIfLatestVersion('some-module', true)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('import', () => {
  it('returns the module when found locally', async () => {
    vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));
    vi.mocked(Http.get).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));
    const module = await Npm.import(NO_CONFIGURATION, 'node:path');
    expect(module).toBeDefined();
  });

  it('throws "Not implemented" when the module is not found locally', async () => {
    await expect(Npm.import(NO_CONFIGURATION, 'non-existent-module-xyz-abc')).rejects.toThrow('Not implemented');
  });

  it('warns when the module is not found locally', async () => {
    await expect(Npm.import(NO_CONFIGURATION, 'non-existent-module-xyz-abc')).rejects.toThrow();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('not found locally') as string })
    );
  });
});
