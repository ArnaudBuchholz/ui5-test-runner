import { FileSystem, Http, Path, Process } from './system/index.js';
import { logger } from './logger.js';
import { memoize } from './utils/memoize.js';

const getNpmCliPath = memoize(async () => {
  const npmChildProcess = Process.spawn('npm', [], {
    shell: true
  });
  await npmChildProcess.closed;
  const error = new Error('Unable to initialize NPM');
  const match = /^npm@([^ ]+) (.*)$/gm.exec(npmChildProcess.stdout);
  if (!match) {
    logger.fatal({ source: 'npm', message: 'Unable to match NPM output', error });
    throw error;
  }
  const [, semver, path] = match;
  if (!semver || !path) {
    logger.fatal({ source: 'npm', message: 'Failed to parse NPM output', error, data: { semver, path } });
    throw error;
  }
  logger.debug({ source: 'npm', message: `npm@${semver} ${path}` });
  return Path.join(path, 'bin/npm-cli.js');
});

const npm = async (...arguments_: string[]) => {
  const npmCliPath = await getNpmCliPath();
  return Process.spawn('node', [npmCliPath, ...arguments_], {
    detached: true // TODO: better ?
  });
};

const getRoots = memoize(async () => {
  const localRootProcess = await npm('root');
  const globalRootProcess = await npm('root', '--global');
  await Promise.all([localRootProcess.closed, globalRootProcess.closed]);
  // TODO check codes and stdout format
  const local = localRootProcess.stdout.trim();
  const global = globalRootProcess.stdout.trim();
  logger.debug({ source: 'npm', message: 'Roots', data: { local, global } });
  return {
    local: localRootProcess.stdout.trim(),
    global: globalRootProcess.stdout.trim()
  };
});

export const Npm = {
  /** fetch the latest version info for the given module */
  async getLatestVersion(moduleName: string): Promise<string> {
    try {
      const response = await Http.get(`https://registry.npmjs.org/${moduleName}/latest`);
      const { version } = JSON.parse(response) as { version: string };
      return version;
    } catch (error) {
      throw new Error(`Unable to fetch latest version of ${moduleName} from NPM registry`, {
        cause: error
      });
    }
  },

  async checkIfLatestVersion(moduleName: string, isLocal: boolean): Promise<void> {
    try {
      const { local, global } = await getRoots();
      const { version: installedVersion } = JSON.parse(
        await FileSystem.readFile(Path.join(isLocal ? local : global, moduleName, 'package.json'), 'utf8')
      ) as { version: string };
      logger.info({ source: 'npm', message: `Installed version of ${moduleName} is ${installedVersion}` });
      const latestVersion = await Npm.getLatestVersion(moduleName);
      if (latestVersion !== installedVersion) {
        logger.warn({ source: 'npm', message: `[PKGVRS] Latest version of ${moduleName} is ${latestVersion}` });
      }
    } catch (error) {
      logger.error({ source: 'npm', message: 'Failed in checkIfLatestVersion', error });
    }
  },

  /** Locate the module (or install it globally) then import it */
  async import(moduleName: string): Promise<unknown> {
    logger.debug({ source: 'npm', message: `Npm.import(${moduleName})` });
    try {
      const module = (await import(moduleName)) as unknown;
      logger.debug({ source: 'npm', message: `Module ${moduleName} found locally` });
      void this.checkIfLatestVersion(moduleName, true);
      return module;
    } catch {
      logger.warn({ source: 'npm', message: `Module ${moduleName} not found locally` });
    }
    throw new Error('Not implemented');
  }
};
