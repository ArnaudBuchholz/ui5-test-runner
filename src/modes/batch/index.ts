import { logger, Exit } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { parallelize } from '../../utils/shared/parallelize.js';
import { start } from '../../start.js';
import { resolve } from './resolve.js';
import { task } from './task.js';

export const batch = async (configuration: Configuration): Promise<void> => {
  const items = await resolve(configuration);
  if (items.length === 0) {
    logger.warn({ source: 'job', message: 'No batch items found' });
    return;
  }

  const startProcess = await start(configuration);
  let failed = 0;

  try {
    await parallelize((item) => task(configuration, item), items, {
      parallel: configuration.parallel,
      on: (event) => {
        if (event.type === 'completed' && event.input.statusCode !== 0) {
          ++failed;
        }
        if (event.type === 'failed') {
          ++failed;
        }
      }
    });
  } finally {
    await startProcess?.kill();
  }

  if (failed > 0) {
    Exit.code = -1;
  }
};
