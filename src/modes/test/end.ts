import { logger, Process } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { Command } from '../../Command.js';

export const end = async (configuration: Configuration): Promise<void> => {
  if (!configuration.end) {
    return;
  }
  logger.info({ source: 'progress', message: 'Executing end command', pageId: undefined, data: { value: 0, max: 0 } });
  const [command, arguments_] = await Command.parse(configuration, configuration.end);
  const process = Process.spawn(command, arguments_);
  await process.closed;
};
