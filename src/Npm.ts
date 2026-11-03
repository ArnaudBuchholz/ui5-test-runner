import type { Configuration } from './configuration/Configuration.js';
import type { IProcess } from './platform/index.js';
import { assert, logger, FileSystem, Http, Module, Path, Process, Url } from './platform/index.js';
import { memoize } from './utils/shared/memoize.js';

export const getNpmCliPath = async () => {
  const npmChildProcess = Process.spawn('npm', [], {
    shell: true
  });
  await npmChildProcess.closed;
  const match = /^npm@([^ ]+) (.*)$/gm.exec(npmChildProcess.stdout);
  assert(match !== null, 'unable to match NPM output');
  const [, semver, path] = match;
  assert(!!semver && !!path, 'failed to parse NPM output');
  logger.debug({ source: 'npm', message: `npm@${semver} ${path}` });
  return Path.join(path, 'bin/npm-cli.js');
};

const memoizedNpmCliPath = memoize(getNpmCliPath);

const npm = async (...arguments_: string[]) => {
  const npmCliPath = await memoizedNpmCliPath();
  return Process.spawn('node', [npmCliPath, ...arguments_], {
    // detached ⇒ child is a process-group leader so Process.kill() can reap npm's install
    // subtree via kill(-pid) on POSIX (see Process.kill). Required, not optional.
    detached: true
  });
};

const validateRoot = async (proc: IProcess, label: string, requiresExistence: boolean): Promise<string> => {
  if (proc.code !== 0) {
    logger.fatal({ source: 'npm', message: `npm root ${label} failed with code ${proc.code}` });
  }
  const value = proc.stdout.trim();
  if (value === '' || !Path.isAbsolute(value)) {
    logger.fatal({ source: 'npm', message: `npm root ${label} returned an invalid path: "${value}"` });
  }
  try {
    await FileSystem.access(value, FileSystem.constants.R_OK);
  } catch (error) {
    // `npm root` reports where node_modules *would* live for the cwd; the directory may not exist
    // yet (a fresh project with nothing installed locally). A missing directory is a normal state —
    // the downstream probe/install flow handles it — so ENOENT is tolerated for a non-requiresExistence
    // root. A directory that exists but genuinely can't be read (EACCES, …) stays fatal.
    const code = (error as NodeJS.ErrnoException).code;
    if (requiresExistence || code !== 'ENOENT') {
      logger.fatal({ source: 'npm', message: `npm root ${label} directory is not accessible: "${value}"` });
    }
  }
  return value;
};

const getRoots = memoize(async () => {
  const localRootProcess = await npm('root');
  const globalRootProcess = await npm('root', '--global');
  await Promise.all([localRootProcess.closed, globalRootProcess.closed]);
  const local = await validateRoot(localRootProcess, '(local)', false);
  const global = await validateRoot(globalRootProcess, '(global)', true);
  logger.debug({ source: 'npm', message: 'roots', data: { local, global } });
  return { local, global };
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
  return strategy === 'prefix'
    ? {
        installArguments: ['install', '--prefix', prefix, '--no-save', ...extraFlags, moduleName],
        reimportPath: Path.join(prefix, 'node_modules')
      }
    : { installArguments: ['install', '--no-save', ...extraFlags, moduleName], reimportPath: undefined };
};

export class Npm {
  protected static dynamicImport(specifier: string): Promise<unknown> {
    return import(specifier);
  }

  /** ESM equivalent of require.resolve: the file:// URL a bare `import(specifier)` would load. */
  protected static resolveSpecifier(specifier: string): string {
    return import.meta.resolve(specifier);
  }

  /** Best-effort resolved location for logging — never throws (resolution can differ from import). */
  private static tryResolveSpecifier(specifier: string): string {
    try {
      return this.resolveSpecifier(specifier);
    } catch {
      return 'unknown location';
    }
  }

  private static tryResolvePackageDir(moduleName: string, nodeModulesPath: string): string | undefined {
    try {
      const packageJsonPath = Module.findPackageJSON(moduleName, `${nodeModulesPath}/`);
      return packageJsonPath === undefined ? undefined : Path.dirname(packageJsonPath);
    } catch {
      return undefined;
    }
  }

  private static async tryImportFromPath(
    configuration: Configuration,
    moduleName: string,
    nodeModulesPath: string
  ): Promise<{ module: unknown; resolved: string } | undefined> {
    // Gate require.resolve behind a findPackageJSON existence check. On some Node versions
    // (24.13.1+, 25.5+, 26.x), a require.resolve(name, { paths }) that misses caches the negative
    // result for the whole process (for packages whose main is not index.js), so a pre-install
    // probe would keep failing even after the package is installed. findPackageJSON does not touch
    // that cache, so skipping the resolve when the package is absent keeps it unpoisoned — and once
    // the package is present, require.resolve runs for the first time and Node resolves it normally.
    if (this.tryResolvePackageDir(this.packageNameOf(moduleName), nodeModulesPath) === undefined) {
      return undefined;
    }
    try {
      // The base only anchors resolution; require.resolve uses the explicit `paths` below, so a
      // directory URL under cwd is sufficient (no package.json needs to exist here).
      const require = Module.createRequire(`${Url.pathToFileURL(configuration.cwd).href}/`);
      const resolved = require.resolve(moduleName, { paths: [nodeModulesPath] });
      return { module: await this.dynamicImport(Url.pathToFileURL(resolved).href), resolved };
    } catch {
      return undefined;
    }
  }

  private static async tryImportFromRoots(
    configuration: Configuration,
    moduleName: string,
    roots: Array<{ path: string; label: string; checkVersion?: boolean }>
  ): Promise<unknown> {
    for (const { path, label, checkVersion } of roots) {
      const result = await this.tryImportFromPath(configuration, moduleName, path);
      if (result !== undefined) {
        logger.debug({ source: 'npm', message: `Module ${moduleName} ${label} (${result.resolved})` });
        if (checkVersion) void this.checkIfLatestVersion(configuration, moduleName);
        return result.module;
      }
    }
    return undefined;
  }

  /**
   * Attempt the bare top-level dynamic import (the fast path when the package resolves locally).
   * Returns the module when found, or undefined to fall through to the per-root probes. Rethrows
   * any error that is not a module-not-found. Skipped entirely under debugNpmNoLocal.
   */
  private static async tryImportLocally(configuration: Configuration, moduleName: string): Promise<unknown> {
    if (configuration.debugNpmNoLocal) {
      return undefined;
    }
    try {
      const module = await this.dynamicImport(moduleName);
      logger.debug({
        source: 'npm',
        message: `Module ${moduleName} found locally (${this.tryResolveSpecifier(moduleName)})`
      });
      void this.checkIfLatestVersion(configuration, moduleName);
      return module;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ERR_MODULE_NOT_FOUND' && code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
      if (moduleName === this.packageNameOf(moduleName)) {
        logger.warn({ source: 'npm', message: `Module ${moduleName} not found locally` });
      }
      return undefined;
    }
  }

  /** Locate the module (or install it) then import it */
  static async import(configuration: Configuration, moduleName: string): Promise<unknown> {
    logger.debug({ source: 'npm', message: `Importing module: ${moduleName}` });

    // debugNpmNoLocal forces resolution past every local path (the top-level import in
    // tryImportLocally and the localRoot probe below), so a test can exercise the global/prefix
    // install-then-reimport path even when the package is already present locally.
    const local = await this.tryImportLocally(configuration, moduleName);
    if (local !== undefined) return local;

    const { local: localRoot, global: globalRoot } = await getRoots();

    const extraRoots = [
      ...(configuration.alternateNpmPath
        ? [{ path: configuration.alternateNpmPath, label: 'found in alternateNpmPath' }]
        : []),
      ...(configuration.npmInstallPrefix
        ? [{ path: Path.join(configuration.npmInstallPrefix, 'node_modules'), label: 'found in npmInstallPrefix' }]
        : [])
    ];

    const found = await this.tryImportFromRoots(configuration, moduleName, [
      ...(configuration.debugNpmNoLocal
        ? []
        : [{ path: localRoot, label: 'found in local node_modules', checkVersion: true }]),
      { path: globalRoot, label: 'found globally', checkVersion: true },
      ...extraRoots
    ]);
    if (found !== undefined) return found;

    if (configuration.noNpmInstall) {
      const message = `Module ${moduleName} not found and noNpmInstall is set`;
      logger.fatal({ source: 'npm', message });
    }

    const strategy = configuration.npmInstall;
    logger.info({ source: 'npm', message: `Installing ${moduleName} (strategy: ${strategy})` });

    const { installArguments, reimportPath } = buildInstallPlan(strategy, moduleName, {
      globalRoot,
      prefix: configuration.npmInstallPrefix ?? '',
      allowScripts: !!configuration.npmAllowInstallScripts,
      minReleaseAge: configuration.npmInstallMinReleaseAge
    });

    const installProcess = await npm(...installArguments);
    await installProcess.closed;

    if (reimportPath !== undefined) {
      const result = await this.tryImportFromPath(configuration, moduleName, reimportPath);
      if (result === undefined) {
        return logger.fatal({ source: 'npm', message: `Module ${moduleName} could not be loaded after install` });
      }
      logger.debug({ source: 'npm', message: `Module ${moduleName} loaded after install (${result.resolved})` });
      return result.module;
    }

    return await this.dynamicImport(moduleName);
  }

  /** Locate the installed package root directory, searching in the same order as Npm.import */
  static async resolvePackageDir(configuration: Configuration, moduleName: string): Promise<string> {
    const { local, global: globalRoot } = await getRoots();

    // debugNpmNoLocal forces resolution past the local root so this stays consistent with
    // Npm.import: a package present both locally and in the prefix must resolve to the SAME copy
    // in both, otherwise the install (resolvePackageDir) and the import drift to different versions
    // — exactly the puppeteer/Chrome version mismatch behind regression #200.
    if (!configuration.debugNpmNoLocal) {
      const fromLocal = this.tryResolvePackageDir(moduleName, local);
      if (fromLocal) return fromLocal;
    }

    const fromGlobal = this.tryResolvePackageDir(moduleName, globalRoot);
    if (fromGlobal) return fromGlobal;

    if (configuration.alternateNpmPath) {
      const fromAlternate = this.tryResolvePackageDir(moduleName, configuration.alternateNpmPath);
      if (fromAlternate) return fromAlternate;
    }

    if (configuration.npmInstallPrefix) {
      const fromPrefix = this.tryResolvePackageDir(
        moduleName,
        Path.join(configuration.npmInstallPrefix, 'node_modules')
      );
      if (fromPrefix) return fromPrefix;
    }

    throw new Error(`Cannot locate package directory for ${moduleName}`);
  }

  /**
   * Resolve the absolute path to a named CLI command declared in the installed package's `bin`
   * field. When `bin` is a string (single-binary package), it is used regardless of `command`.
   * When `bin` is an object, `command` is used as the lookup key. Fatally logs when no matching
   * entry is found. Drives the binary install of the *same* resolved package that Npm.import loads —
   * avoiding the version drift that caused regression #200 when using a bare `npx <pkg>` call.
   */
  static async resolvePackageBinCommand(
    configuration: Configuration,
    moduleName: string,
    command: string
  ): Promise<string> {
    const packageDirectory = await this.resolvePackageDir(configuration, moduleName);
    const { bin } = JSON.parse(
      await FileSystem.readFile(Path.join(packageDirectory, 'package.json'), 'utf8')
    ) as { bin?: string | Record<string, string> };
    const binRelativePath = typeof bin === 'string' ? bin : bin?.[command];
    if (!binRelativePath) {
      return logger.fatal({ source: 'npm', message: `Unable to locate command "${command}" in ${moduleName} package.json "bin"` });
    }
    return Path.join(packageDirectory, binRelativePath);
  }

  /** Extract the npm package name from a module specifier (strips sub-paths) */
  private static packageNameOf(moduleName: string): string {
    if (moduleName.startsWith('@')) {
      const [scope, package_] = moduleName.split('/', 2);
      return `${scope}/${package_}`;
    }
    return moduleName.split('/', 1)[0]!;
  }

  /** fetch the latest version info for the given module */
  static async getLatestVersion(packageName: string): Promise<string> {
    try {
      const response = await Http.getAsText(`https://registry.npmjs.org/${packageName}/latest`);
      const { version } = JSON.parse(response) as { version: string };
      return version;
    } catch (error) {
      throw new Error(`Unable to fetch latest version of ${packageName} from NPM registry`, {
        cause: error
      });
    }
  }

  private static readonly _checkedPackages = new Set<string>();

  static async checkIfLatestVersion(configuration: Configuration, moduleName: string): Promise<void> {
    const packageName = this.packageNameOf(moduleName);
    if (this._checkedPackages.has(packageName)) {
      return;
    }
    this._checkedPackages.add(packageName);
    try {
      const packageDirectory = await this.resolvePackageDir(configuration, packageName);
      const { version: installedVersion } = JSON.parse(
        await FileSystem.readFile(Path.join(packageDirectory, 'package.json'), 'utf8')
      ) as { version: string };
      logger.info({ source: 'npm', message: `Installed version of ${packageName} is ${installedVersion}` });
      const latestVersion = await this.getLatestVersion(packageName);
      if (latestVersion !== installedVersion) {
        logger.warn({ source: 'npm', message: `Latest version of ${packageName} is ${latestVersion}` });
      }
    } catch (error) {
      logger.error({ source: 'npm', message: 'failed in checkIfLatestVersion', error });
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
      logger.error({ source: 'npm', message: 'failed to list package script names', error, data: { cwd } });
      return [];
    }
  }
}
