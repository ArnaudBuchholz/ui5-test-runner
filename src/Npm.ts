import type { Configuration } from './configuration/Configuration.js';
import { assert, logger, FileSystem, Http, Module, Path, Process, Url } from './platform/index.js';
import { memoize } from './utils/shared/memoize.js';

export const getNpmCliPath = async () => {
  const npmChildProcess = Process.spawn('npm', [], {
    shell: true
  });
  await npmChildProcess.closed;
  const match = /^npm@([^ ]+) (.*)$/gm.exec(npmChildProcess.stdout);
  assert(match !== null, 'Unable to match NPM output');
  const [, semver, path] = match;
  assert(!!semver && !!path, 'Failed to parse NPM output');
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

type InstallOptions = {
  globalRoot: string;
  prefix: string;
  allowScripts: boolean;
  minReleaseAge: number;
};

const buildInstallPlan = (strategy: string, moduleName: string, options: InstallOptions): InstallPlan => {
  const { globalRoot, prefix, allowScripts, minReleaseAge } = options;
  const noScripts = allowScripts ? [] : ['--ignore-scripts'];
  const releaseAge = minReleaseAge > 0 ? [`--min-release-age=${minReleaseAge}`] : [];
  const extraFlags = [...noScripts, ...releaseAge];
  if (strategy === 'global') {
    return { installArguments: ['install', '-g', ...extraFlags, moduleName], reimportPath: globalRoot };
  }
  if (strategy === 'prefix') {
    return {
      installArguments: ['install', '--prefix', prefix, '--no-save', ...extraFlags, moduleName],
      reimportPath: Path.join(prefix, 'node_modules')
    };
  }
  return { installArguments: ['install', '--no-save', ...extraFlags, moduleName], reimportPath: undefined };
};

export class Npm {
  protected static dynamicImport(specifier: string): Promise<unknown> {
    return import(specifier);
  }

  private static tryResolvePackageDir(
    configuration: Configuration,
    moduleName: string,
    nodeModulesPath: string
  ): string | undefined {
    try {
      const require = Module.createRequire(Url.pathToFileURL(Path.join(configuration.cwd, 'package.json')).href);
      return Path.dirname(require.resolve(`${moduleName}/package.json`, { paths: [nodeModulesPath] }));
    } catch {
      return undefined;
    }
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

  /** Locate the module (or install it) then import it */
  static async import(configuration: Configuration, moduleName: string): Promise<unknown> {
    logger.debug({ source: 'npm', message: `Importing module: ${moduleName}` });

    try {
      const module = await this.dynamicImport(moduleName);
      logger.debug({ source: 'npm', message: `Module ${moduleName} found locally` });
      void this.checkIfLatestVersion(configuration, moduleName);
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
      void this.checkIfLatestVersion(configuration, moduleName);
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
    }

    const strategy = configuration.npmInstall;
    logger.info({ source: 'npm', message: `Installing ${moduleName} (strategy: ${strategy})` });

    const { installArguments, reimportPath } = buildInstallPlan(strategy, moduleName, {
      globalRoot,
      prefix: configuration.npmInstallPrefix ?? '',
      allowScripts: configuration.npmAllowInstallScripts,
      minReleaseAge: configuration.npmInstallMinReleaseAge
    });

    const installProcess = await npm(...installArguments);
    await installProcess.closed;

    if (reimportPath !== undefined) {
      const result = await this.tryImportFromPath(configuration, moduleName, reimportPath);
      if (result === undefined) {
        const message = `Module ${moduleName} could not be loaded after install`;
        logger.fatal({ source: 'npm', message });
      }
      return result;
    }

    return await this.dynamicImport(moduleName);
  }

  /** Locate the installed package root directory, searching in the same order as Npm.import */
  static async resolvePackageDir(configuration: Configuration, moduleName: string): Promise<string> {
    const { local, global: globalRoot } = await getRoots();

    const fromLocal = this.tryResolvePackageDir(configuration, moduleName, local);
    if (fromLocal) return fromLocal;

    const fromGlobal = this.tryResolvePackageDir(configuration, moduleName, globalRoot);
    if (fromGlobal) return fromGlobal;

    if (configuration.alternateNpmPath) {
      const fromAlternate = this.tryResolvePackageDir(configuration, moduleName, configuration.alternateNpmPath);
      if (fromAlternate) return fromAlternate;
    }

    if (configuration.npmInstallPrefix) {
      const fromPrefix = this.tryResolvePackageDir(
        configuration,
        moduleName,
        Path.join(configuration.npmInstallPrefix, 'node_modules')
      );
      if (fromPrefix) return fromPrefix;
    }

    throw new Error(`Cannot locate package directory for ${moduleName}`);
  }

  /** fetch the latest version info for the given module */
  static async getLatestVersion(moduleName: string): Promise<string> {
    try {
      const response = await Http.getAsText(`https://registry.npmjs.org/${moduleName}/latest`);
      const { version } = JSON.parse(response) as { version: string };
      return version;
    } catch (error) {
      throw new Error(`Unable to fetch latest version of ${moduleName} from NPM registry`, {
        cause: error
      });
    }
  }

  static async checkIfLatestVersion(configuration: Configuration, moduleName: string): Promise<void> {
    try {
      const packageDirectory = await this.resolvePackageDir(configuration, moduleName);
      const { version: installedVersion } = JSON.parse(
        await FileSystem.readFile(Path.join(packageDirectory, 'package.json'), 'utf8')
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

  static async getCliPath() {
    return await memoizedNpmCliPath();
  }

  static async listPackageScriptNames(cwd: string): Promise<string[]> {
    try {
      const packageJsonPath = Module.findPackageJSON(`${Url.pathToFileURL(cwd).href}/`);
      if (!packageJsonPath) {
        return [];
      }
      const content = JSON.parse(await FileSystem.readFile(packageJsonPath, 'utf8')) as {
        scripts?: Record<string, string>;
      };
      return Object.keys(content?.scripts ?? {});
    } catch (error) {
      logger.error({ source: 'npm', message: 'Failed to list package script names', error, data: { cwd } });
      return [];
    }
  }
}
