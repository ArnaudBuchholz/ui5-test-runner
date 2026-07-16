import { logger, Exit, Process } from './platform/index.js';
import type { Configuration } from './configuration/Configuration.js';
import { Command } from './Command.js';
import { formatDuration } from './utils/shared/string.js';

export const end = async (configuration: Configuration): Promise<void> => {
  if (!configuration.end) {
    return;
  }
  const start = Date.now();
  logger.info({ source: 'job', message: 'Executing end command...' });
  logger.info({ source: 'progress', message: 'Executing end command', pageId: undefined, data: { value: 0, max: 0 } });
  const [command, arguments_] = await Command.parse(configuration, configuration.end);
  const process = Process.spawn(command, arguments_, {
    cwd: configuration.cwd
  });
  let code: number | undefined;
  if (configuration.endTimeout) {
    let didTimeout = false;
    const timeout = new Promise<void>((resolve) =>
      setTimeout(() => {
        didTimeout = true;
        resolve();
      }, configuration.endTimeout)
    );
    await Promise.race([process.closed, timeout]);
    if (didTimeout) {
      logger.fatal({ source: 'job', message: 'End command timed out, killing' });
      await process.kill();
      code = -1; // Error
    } else {
      code = process.code;
    }
  } else {
    await process.closed;
    code = process.code;
  }
  if (code !== undefined) {
    const before = Exit.code;
    if (before === 0 && code !== 0) {
      logger.warn({
        source: 'job',
        message: 'Status changed to error by end command'
      });
    } else if (before !== 0 && code === 0) {
      logger.warn({
        source: 'job',
        message: 'Status changed to success by end command'
      });
    }
    Exit.code = code;
  }
  const duration = formatDuration(Date.now() - start);
  logger.info({ source: 'job', message: `End command executed (${duration})` });
};
