import { logger } from './logger.js';
import { Platform } from './Platform.js';

type Roots = {
  local: string;
  global: string;
};

let roots: Promise<Roots> | undefined;

const getRoots = async () => {
  if (!roots) {
    const localRoot = Platform.exec('npm', ['root']);
    const globalRoot = Platform.exec('npm', ['root', '--global']);
    roots = Promise.all([localRoot.closed, globalRoot.closed]).then(() => {
      return {
        local: localRoot.stdout.trim(),
        global: globalRoot.stdout.trim()
      };
    });
  }
  return roots;
};

export const Npm = {
  /** fetch the latest version info for the given module */
  async getLatestVersion(moduleName: string): Promise<string> {
    try {
      const response = await fetch(`https://registry.npmjs.org/${moduleName}/latest`);
      if (response.status / 100 === 2) {
        const { version } = (await response.json()) as { version: string };
        return version;
      }
      throw new Error(`Response status code ${response.status}`);
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
        await Platform.readFile(Platform.join(isLocal ? local : global, moduleName, 'package.json'), 'utf8')
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
