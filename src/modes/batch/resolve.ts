import { FileSystem, Path, logger } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { IBatchItem } from './BatchItem.js';

const folder = (items: IBatchItem[], folderPath: string): void => {
  const id = Path.basename(folderPath);
  items.push({
    path: folderPath,
    id,
    label: id,
    args: ['--cwd', folderPath]
  });
};

const configurationFile = async (items: IBatchItem[], configPath: string): Promise<void> => {
  try {
    const content = await FileSystem.readFile(configPath, 'utf8');
    const parsed = JSON.parse(content) as { batchId?: string; batchLabel?: string };
    const id = parsed.batchId ?? Path.basename(configPath);
    const label = parsed.batchLabel ?? Path.basename(configPath);
    items.push({
      path: configPath,
      id,
      label,
      args: ['--config', configPath]
    });
  } catch {
    logger.warn({
      source: 'job',
      message: 'batch item failed',
      data: { path: configPath, reason: 'invalid JSON configuration file' }
    });
  }
};

const scan = async (items: IBatchItem[], cwd: string, re: RegExp): Promise<void> => {
  const names = await FileSystem.readdir(cwd);
  for (const name of names) {
    const path = Path.join(cwd, name);
    const pathStat = await FileSystem.stat(path);
    if (pathStat.isDirectory()) {
      if (re.test(path) || re.test(path.replaceAll('\\', '/'))) {
        folder(items, path);
        continue;
      }
      await scan(items, path, re);
    } else if (pathStat.isFile() && (re.test(path) || re.test(path.replaceAll('\\', '/')))) {
      await configurationFile(items, path);
    }
  }
};

export const resolve = async (configuration: Configuration): Promise<IBatchItem[]> => {
  const items: IBatchItem[] = [];
  const specs = configuration.batch ?? [];
  for (const spec of specs) {
    // Try as a direct path first (folder or JSON file)
    try {
      const path = Path.isAbsolute(spec) ? spec : Path.join(configuration.cwd, spec);
      const pathStat = await FileSystem.stat(path);
      if (pathStat.isDirectory()) {
        folder(items, path);
      } else if (pathStat.isFile() && path.endsWith('.json')) {
        await configurationFile(items, path);
      } else {
        logger.warn({
          source: 'job',
          message: 'batch item failed',
          data: { path: spec, reason: 'only folders and JSON configuration files are supported' }
        });
      }
      continue;
    } catch {
      // not a path — try as regex
    }
    let re: RegExp;
    try {
      // eslint-disable-next-line security/detect-non-literal-regexp -- spec is user-provided and intentionally treated as a regex pattern
      re = new RegExp(spec);
    } catch {
      logger.warn({
        source: 'job',
        message: 'batch item failed',
        data: { path: spec, reason: 'invalid regular expression' }
      });
      continue;
    }
    await scan(items, configuration.cwd, re);
  }
  return items;
};
