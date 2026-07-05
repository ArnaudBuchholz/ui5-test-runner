import type { Configuration } from './configuration/Configuration.js';
import { logger, FileSystem, Http, Module, Path, Process, Url } from './platform/index.js';
import { memoize } from './utils/shared/memoize.js';

export const getNpmCliPath = async () => {
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
};

const memoizedNpmCliPath = memoize(getNpmCliPath);

const npm = async (...arguments_: string[]) => {
  const npmCliPath = await memoizedNpmCliPath();
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

type InstallPlan = {
  installArguments: string[];
  reimportPath: string | undefined;
};

const buildInstallPlan = (strategy: string, moduleName: string, globalRoot: string, prefix: string): InstallPlan => {
  if (strategy === 'global') {
    return { installArguments: ['install', '-g', moduleName], reimportPath: globalRoot };
  }
  if (strategy === 'prefix') {
    return {
      installArguments: ['install', '--prefix', prefix, '--no-save', moduleName],
      reimportPath: Path.join(prefix, 'node_modules')
    };
  }
  return { installArguments: ['install', '--no-save', moduleName], reimportPath: undefined };
};

export class Npm {
  protected static dynamicImport(specifier: string): Promise<unknown> {
    return import(specifier);
  }

  private static async tryImportFromPath(
    configuration: Configuration,
    moduleName: string,
    nodeModulesPath: string
  ): Promise<unknown> {
    try {
      // TODO: check if package.json is required here
      const require = Module.createRequire(Url.pathToFileURL(Path.join(configuration.cwd, 'package.json')).href);
      const resolved = require.resolve(moduleName, { paths: [nodeModulesPath] });
      return await this.dynamicImport(Url.pathToFileURL(resolved).href);
    } catch {
      return undefined;
    }
  }

  /** fetch the latest version info for the given module */
  static async getLatestVersion(moduleName: string): Promise<string> {
    try {
      const response = await Http.get(`https://registry.npmjs.org/${moduleName}/latest`);
      const { version } = JSON.parse(response) as { version: string };
      return version;
    } catch (error) {
      throw new Error(`Unable to fetch latest version of ${moduleName} from NPM registry`, {
        cause: error
      });
    }
  }

  static async checkIfLatestVersion(moduleName: string, isLocal: boolean): Promise<void> {
    try {
      const { local, global } = await getRoots();
      const { version: installedVersion } = JSON.parse(
        await FileSystem.readFile(Path.join(isLocal ? local : global, moduleName, 'package.json'), 'utf8')
      ) as { version: string };
      logger.info({ source: 'npm', message: `Installed version of ${moduleName} is ${installedVersion}` });
      const latestVersion = await this.getLatestVersion(moduleName);
      if (latestVersion !== installedVersion) {
        logger.warn({ source: 'npm', message: `[PKGVRS] Latest version of ${moduleName} is ${latestVersion}` });
      }
    } catch (error) {
      logger.error({ source: 'npm', message: 'Failed in checkIfLatestVersion', error });
    }
  }

  /** Locate the module (or install it) then import it */
  static async import(configuration: Configuration, moduleName: string): Promise<unknown> {
    logger.debug({ source: 'npm', message: `Importing module: ${moduleName}` });

    try {
      const module = await this.dynamicImport(moduleName);
      logger.debug({ source: 'npm', message: `Module ${moduleName} found locally` });
      void this.checkIfLatestVersion(moduleName, true);
      return module;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ERR_MODULE_NOT_FOUND' && code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
      logger.warn({ source: 'npm', message: `Module ${moduleName} not found locally` });
    }

    const { global: globalRoot } = await getRoots();
    const fromGlobal = await this.tryImportFromPath(configuration, moduleName, globalRoot);
    if (fromGlobal !== undefined) {
      logger.debug({ source: 'npm', message: `Module ${moduleName} found globally` });
      void this.checkIfLatestVersion(moduleName, false);
      return fromGlobal;
    }

    if (configuration.alternateNpmPath) {
      const fromAlternate = await this.tryImportFromPath(configuration, moduleName, configuration.alternateNpmPath);
      if (fromAlternate !== undefined) {
        logger.debug({ source: 'npm', message: `Module ${moduleName} found in alternateNpmPath` });
        return fromAlternate;
      }
    }

    if (configuration.npmInstallPrefix) {
      const fromPrefix = await this.tryImportFromPath(
        configuration,
        moduleName,
        Path.join(configuration.npmInstallPrefix, 'node_modules')
      );
      if (fromPrefix !== undefined) {
        logger.debug({ source: 'npm', message: `Module ${moduleName} found in npmInstallPrefix` });
        return fromPrefix;
      }
    }

    if (configuration.noNpmInstall) {
      const message = `Module ${moduleName} not found and noNpmInstall is set`;
      logger.fatal({ source: 'npm', message });
      throw new Error(message);
    }

    const strategy = configuration.npmInstall;
    logger.info({ source: 'npm', message: `Installing ${moduleName} (strategy: ${strategy})` });

    const { installArguments, reimportPath } = buildInstallPlan(
      strategy,
      moduleName,
      globalRoot,
      configuration.npmInstallPrefix ?? ''
    );

    const installProcess = await npm(...installArguments);
    await installProcess.closed;

    if (reimportPath !== undefined) {
      const result = await this.tryImportFromPath(configuration, moduleName, reimportPath);
      if (result === undefined) {
        const message = `Module ${moduleName} could not be loaded after install`;
        logger.fatal({ source: 'npm', message });
        throw new Error(message);
      }
      return result;
    }

    return await this.dynamicImport(moduleName);
  }
}
