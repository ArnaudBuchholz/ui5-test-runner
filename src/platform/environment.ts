import { __sourcesRoot } from './constants.js';
import { FileSystem } from './FileSystem.js';
import { Host } from './Host.js';
import { Path } from './Path.js';
import { logger } from './logger.js';

export const logEnvironnement = async () => {
  const { name, version } = JSON.parse(
    await FileSystem.readFile(Path.join(__sourcesRoot, '../package.json'), 'utf8')
  ) as { name: string; version: string };
  const now = new Date();
  logger.info({
    source: 'job',
    message: `${name}@${version} / Node.js ${Host.nodeVersion} / ${now.toISOString()} (${now.getTimezoneOffset()})`
  });
  const cpus: { [key in string]?: number } = {};
  for (const { model } of Host.cpus()) {
    if (cpus[model]) {
      ++cpus[model];
    } else {
      cpus[model] = 1;
    }
  }
  for (const [model, count] of Object.entries(cpus)) {
    if (count === 1) {
      logger.info({ source: 'job', message: `${Host.machine()} / ${model}` });
    } else {
      logger.info({ source: 'job', message: `${Host.machine()} / ${count}x ${model}` });
    }
  }
};
