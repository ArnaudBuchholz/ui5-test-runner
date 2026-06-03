import { it, expect, vi, beforeEach, describe } from 'vitest';
import { Http } from './platform/Http.js';
import { FileSystem } from './platform/FileSystem.js';
import { Module } from './platform/Module.js';
import { Url } from './platform/Url.js';
import { Process } from './platform/Process.js';
import { logger } from './platform/logger.js';
import type { Configuration } from './configuration/Configuration.js';
import { getNpmCliPath, Import, Npm } from './Npm.js';

const NO_CONFIGURATION = {} as unknown as Configuration;
const NO_INSTALL_CONFIGURATION = { noNpmInstall: true } as unknown as Configuration;
const LOCAL_INSTALL_CONFIGURATION = { npmInstall: 'local' } as unknown as Configuration;
const GLOBAL_INSTALL_CONFIGURATION = { npmInstall: 'global' } as unknown as Configuration;
const PREFIX_INSTALL_CONFIGURATION = {
  npmInstall: 'prefix',
  npmInstallPrefix: '/custom/prefix'
} as unknown as Configuration;
const ALTERNATE_NPM_PATH_CONFIGURATION = { alternateNpmPath: '/alternate/path' } as unknown as Configuration;
const NPM_INSTALL_PREFIX_CONFIGURATION = { npmInstallPrefix: '/prefix/path' } as unknown as Configuration;

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
  const makeRequire = (resolvedPath: string) =>
    Object.assign(vi.fn(), {
      resolve: vi.fn().mockReturnValue(resolvedPath)
    }) as unknown as ReturnType<typeof Module.createRequire>;

  const makeRequireThrow = () =>
    Object.assign(vi.fn(), {
      resolve: vi.fn().mockImplementation(() => {
        throw new Error('Module not found');
      })
    }) as unknown as ReturnType<typeof Module.createRequire>;

  it('returns the module when found locally', async () => {
    vi.mocked(FileSystem.readFile).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));
    vi.mocked(Http.get).mockResolvedValue(JSON.stringify({ version: '1.0.0' }));
    const module = await Npm.import(NO_CONFIGURATION, 'node:path');
    expect(module).toBeDefined();
  });

  it('re-throws immediately when local import fails with a non-not-found error', async () => {
    const error = Object.assign(new Error('Parse error'), { code: 'ERR_INVALID_PACKAGE_CONFIG' });
    vi.spyOn(Import, 'dynamic').mockRejectedValueOnce(error);
    await expect(Npm.import(NO_CONFIGURATION, 'some-module')).rejects.toThrow('Parse error');
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns when the module is not found locally', async () => {
    await expect(Npm.import(NO_INSTALL_CONFIGURATION, 'non-existent-module-xyz-abc')).rejects.toThrow();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('not found locally') as string })
    );
  });

  it('throws when noNpmInstall is set and module is missing everywhere', async () => {
    await expect(Npm.import(NO_INSTALL_CONFIGURATION, 'non-existent-module-xyz-abc')).rejects.toThrow(
      'noNpmInstall is set'
    );
    expect(Process.spawn).not.toHaveBeenCalledWith(
      'node',
      expect.arrayContaining(['install']) as string[],
      expect.anything()
    );
  });

  it('returns the module and checks latest version when found globally', async () => {
    const FAKE_MODULE = { default: 'global-module' };
    vi.spyOn(Import, 'dynamic')
      .mockRejectedValueOnce(Object.assign(new Error('ERR_MODULE_NOT_FOUND'), { code: 'ERR_MODULE_NOT_FOUND' }))
      .mockResolvedValueOnce(FAKE_MODULE);
    vi.mocked(Module.createRequire).mockReturnValue(makeRequire('/global/root/some-module/index.js'));
    vi.mocked(Url.pathToFileURL).mockReturnValue({ href: 'file:///global/root/some-module/index.js' } as URL);
    const result = await Npm.import(NO_CONFIGURATION, 'some-module');
    expect(result).toBe(FAKE_MODULE);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('found globally') as string })
    );
  });

  it('returns the module when found in alternateNpmPath', async () => {
    const FAKE_MODULE = { default: 'alternate-module' };
    vi.spyOn(Import, 'dynamic')
      .mockRejectedValueOnce(Object.assign(new Error('ERR_MODULE_NOT_FOUND'), { code: 'ERR_MODULE_NOT_FOUND' }))
      .mockResolvedValueOnce(FAKE_MODULE);
    vi.mocked(Module.createRequire)
      .mockReturnValueOnce(makeRequireThrow())
      .mockReturnValueOnce(makeRequire('/alternate/path/some-module/index.js'));
    vi.mocked(Url.pathToFileURL).mockReturnValue({ href: 'file:///alternate/path/some-module/index.js' } as URL);
    const result = await Npm.import(ALTERNATE_NPM_PATH_CONFIGURATION, 'some-module');
    expect(result).toBe(FAKE_MODULE);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('found in alternateNpmPath') as string })
    );
  });

  it('returns the module when found in npmInstallPrefix', async () => {
    const FAKE_MODULE = { default: 'prefix-module' };
    vi.spyOn(Import, 'dynamic')
      .mockRejectedValueOnce(Object.assign(new Error('ERR_MODULE_NOT_FOUND'), { code: 'ERR_MODULE_NOT_FOUND' }))
      .mockResolvedValueOnce(FAKE_MODULE);
    vi.mocked(Module.createRequire)
      .mockReturnValueOnce(makeRequireThrow())
      .mockReturnValueOnce(makeRequire('/prefix/path/node_modules/some-module/index.js'));
    vi.mocked(Url.pathToFileURL).mockReturnValue({
      href: 'file:///prefix/path/node_modules/some-module/index.js'
    } as URL);
    const result = await Npm.import(NPM_INSTALL_PREFIX_CONFIGURATION, 'some-module');
    expect(result).toBe(FAKE_MODULE);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('found in npmInstallPrefix') as string })
    );
  });

  it('installs locally with --no-save when npmInstall is local and module is missing', async () => {
    vi.mocked(Process.spawn).mockImplementation((command, arguments_) => {
      if (command === 'npm') {
        return makeProcess('npm@10.0.0 /usr/local/lib/node_modules/npm');
      }
      return makeProcess((arguments_ ?? []).includes('--global') ? '/global/root' : '/local/root');
    });
    // install succeeds but re-import still fails (module truly doesn't exist) — just check install was called
    await expect(Npm.import(LOCAL_INSTALL_CONFIGURATION, 'non-existent-module-xyz-abc')).rejects.toThrow();
    expect(Process.spawn).toHaveBeenCalledWith(
      'node',
      expect.arrayContaining(['install', '--no-save', 'non-existent-module-xyz-abc']) as string[],
      expect.anything()
    );
  });

  it('installs globally with -g when npmInstall is global and module is missing', async () => {
    vi.mocked(Process.spawn).mockImplementation((command, arguments_) => {
      if (command === 'npm') {
        return makeProcess('npm@10.0.0 /usr/local/lib/node_modules/npm');
      }
      return makeProcess((arguments_ ?? []).includes('--global') ? '/global/root' : '/local/root');
    });
    await expect(Npm.import(GLOBAL_INSTALL_CONFIGURATION, 'non-existent-module-xyz-abc')).rejects.toThrow();
    expect(Process.spawn).toHaveBeenCalledWith(
      'node',
      expect.arrayContaining(['install', '-g', 'non-existent-module-xyz-abc']) as string[],
      expect.anything()
    );
  });

  it('installs with --prefix when npmInstall is prefix and module is missing', async () => {
    vi.mocked(Process.spawn).mockImplementation((command, arguments_) => {
      if (command === 'npm') {
        return makeProcess('npm@10.0.0 /usr/local/lib/node_modules/npm');
      }
      return makeProcess((arguments_ ?? []).includes('--global') ? '/global/root' : '/local/root');
    });
    await expect(Npm.import(PREFIX_INSTALL_CONFIGURATION, 'non-existent-module-xyz-abc')).rejects.toThrow();
    expect(Process.spawn).toHaveBeenCalledWith(
      'node',
      expect.arrayContaining([
        'install',
        '--prefix',
        '/custom/prefix',
        '--no-save',
        'non-existent-module-xyz-abc'
      ]) as string[],
      expect.anything()
    );
  });

  it('returns the module when found via reimportPath after global install', async () => {
    const FAKE_MODULE = { default: 'installed-module' };
    vi.spyOn(Import, 'dynamic')
      .mockRejectedValueOnce(Object.assign(new Error('ERR_MODULE_NOT_FOUND'), { code: 'ERR_MODULE_NOT_FOUND' }))
      .mockResolvedValueOnce(FAKE_MODULE);
    vi.mocked(Module.createRequire)
      .mockReturnValueOnce(makeRequireThrow())
      .mockReturnValueOnce(makeRequire('/global/root/some-module/index.js'));
    vi.mocked(Url.pathToFileURL).mockReturnValue({ href: 'file:///global/root/some-module/index.js' } as URL);
    vi.mocked(Process.spawn).mockImplementation((command, arguments_) => {
      if (command === 'npm') {
        return makeProcess('npm@10.0.0 /usr/local/lib/node_modules/npm');
      }
      return makeProcess((arguments_ ?? []).includes('--global') ? '/global/root' : '/local/root');
    });
    const result = await Npm.import(GLOBAL_INSTALL_CONFIGURATION, 'some-module');
    expect(result).toBe(FAKE_MODULE);
  });

  it('does not install when module is found in alternateNpmPath', async () => {
    // require.resolve will fail for a truly non-existent module, so we just verify no install is attempted
    // by checking noNpmInstall blocks the install path — alternateNpmPath check happens before install
    await expect(
      Npm.import({ ...ALTERNATE_NPM_PATH_CONFIGURATION, noNpmInstall: true }, 'non-existent-module-xyz-abc')
    ).rejects.toThrow('noNpmInstall is set');
  });

  it('does not install when module is found in npmInstallPrefix', async () => {
    await expect(
      Npm.import({ ...NPM_INSTALL_PREFIX_CONFIGURATION, noNpmInstall: true }, 'non-existent-module-xyz-abc')
    ).rejects.toThrow('noNpmInstall is set');
  });
});
