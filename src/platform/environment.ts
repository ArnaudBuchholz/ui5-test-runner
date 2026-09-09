import { Host } from './Host.js';
import { logger } from './logger.js';
import { version } from './version.js';
import { countCpuModels } from '../utils/shared/host.js';

export const logEnvironnement = async () => {
  const { name, version: semver } = await version();
  const now = new Date();
  logger.info({
    source: 'job',
    message: `${name}@${semver} / Node.js ${Host.nodeVersion} / ${now.toISOString()} (${now.getTimezoneOffset()})`
  });
  const machine = Host.machine();
  for (const { model, count } of countCpuModels(Host.cpus())) {
    logger.info({
      source: 'job',
      message: count === 1 ? `${machine} / ${model}` : `${machine} / ${count}x ${model}`
    });
  }
};
