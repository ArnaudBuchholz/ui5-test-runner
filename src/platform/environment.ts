import { Host } from './Host.js';
import { logger } from './logger.js';
import { version } from './version.js';

export const logEnvironnement = async () => {
  const runnerVersion = await version();
  const now = new Date();
  logger.info({
    source: 'job',
    message: `${runnerVersion} / Node.js ${Host.nodeVersion} / ${now.toISOString()} (${now.getTimezoneOffset()})`
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
