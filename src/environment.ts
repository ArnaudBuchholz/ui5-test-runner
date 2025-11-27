import { logger } from './logger.js';
import { Platform } from './Platform.js';

export const logEnvironnement = async () => {
  const { name, version } = JSON.parse(await Platform.readFile(Platform.join(__dirname, '../package.json'), 'utf-8')) as { name: string; version: string };
  const now = new Date();
  logger.info({ source: 'job', message: `${name}@${version} / Node.js ${Platform.nodeVersion} / ${now.toISOString()} (${now.getTimezoneOffset()})`});
  const cpus: { [key in string]?: number } = {};
  for (const { model } of Platform.cpus()) {
    if (cpus[model]) {
      ++cpus[model];
    } else {
      cpus[model] = 1;
    }
  }
  for (const [model, count] of Object.entries(cpus)) {
    logger.info({ source: 'job', message: `${Platform.machine()} / ${count}x ${model}`});
  }
};
