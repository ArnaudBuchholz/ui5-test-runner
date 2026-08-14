import { Npm } from '../../../Npm.js';
import { Module, Path, Process, Url } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';

let cachedBinPath: string | undefined;

const resolveNycDir = async (configuration: Configuration): Promise<string> => {
  const cwdRequire = Module.createRequire(
    Url.pathToFileURL(Path.join(configuration.cwd, 'package.json')).href
  );
  const tryResolve = (paths: string[]): string | undefined => {
    try {
      return Path.dirname(cwdRequire.resolve('nyc/package.json', { paths }));
    } catch {
      return undefined;
    }
  };

  const fromLocal = tryResolve([Path.join(configuration.cwd, 'node_modules')]);
  if (fromLocal) return fromLocal;

  if (configuration.alternateNpmPath) {
    const fromAlternate = tryResolve([configuration.alternateNpmPath]);
    if (fromAlternate) return fromAlternate;
  }

  if (configuration.npmInstallPrefix) {
    const fromPrefix = tryResolve([Path.join(configuration.npmInstallPrefix, 'node_modules')]);
    if (fromPrefix) return fromPrefix;
  }

  const npmCliPath = await Npm.getCliPath();
  const globalRootProcess = Process.spawn('node', [npmCliPath, 'root', '--global'], { detached: true });
  await globalRootProcess.closed;
  const fromGlobal = tryResolve([globalRootProcess.stdout.trim()]);
  if (fromGlobal) return fromGlobal;

  throw new Error('Cannot locate nyc — ensure it is installed (globally or locally)');
};

export const getNycBin = async (configuration: Configuration): Promise<string> => {
  if (cachedBinPath !== undefined) {
    return cachedBinPath;
  }
  await Npm.import(configuration, 'nyc');
  const nycDir = await resolveNycDir(configuration);
  cachedBinPath = Path.join(nycDir, 'bin', 'nyc.js');
  return cachedBinPath;
};
