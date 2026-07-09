import { logger, Exit, Process } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { Command } from '../../Command.js';

export const end = async (configuration: Configuration): Promise<void> => {
  if (!configuration.end) {
    return;
  }
  logger.info({ source: 'progress', message: 'Executing end command', pageId: undefined, data: { value: 0, max: 0 } });
  const [command, arguments_] = await Command.parse(configuration, configuration.end);
  const process = Process.spawn(command, arguments_, {
    cwd: configuration.cwd
  });
  let code: number | undefined;
  if (!configuration.endTimeout) {
    await process.closed;
    code = process.code;
  } else {
    let didTimeOut = false;
    const timeout = new Promise<void>((resolve) => setTimeout(() => {
      didTimeOut = true;
      resolve();
    }, configuration.endTimeout));
    await Promise.race([process.closed, timeout]);
    if (didTimeOut) {
      logger.fatal({ source: 'job', message: 'End command timed out, killing' });
      await process.kill();
      code = -1; // Error
    } else {
      code = process.code;
    }
  }
  if (code !== undefined) {
    Exit.code = code;
  }
};
