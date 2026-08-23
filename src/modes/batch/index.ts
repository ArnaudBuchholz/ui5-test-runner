import { logger, Exit, logEnvironnement } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { parallelize } from '../../utils/shared/parallelize.js';
import { start } from '../../start.js';
import { resolve } from './resolve.js';
import { batchTask } from './batchTask.js';
import { buildBatchReport } from './report.js';
import { defaults } from '../../configuration/options.js';
import { Folder } from '../../utils/node/Folder.js';
import { saveReport } from '../../reports/saveReport.js';
import { formatDuration } from '../../utils/shared/string.js';

export const batch = async (configuration: Configuration): Promise<void> => {
  const batchStart = Date.now();
  await Folder.create(configuration.reportDir);
  await logger.start(configuration);
  logger.debug({ source: 'job', message: 'Configuration', data: { defaults, configuration } });
  await logEnvironnement();
  logger.info({ source: 'progress', message: 'Resolving batch items', pageId: undefined, data: { value: 0, max: 0 } });
  const items = await resolve(configuration);
  if (items.length === 0) {
    logger.warn({ source: 'job', message: 'No batch items found' });
    return;
  }
  logger.info({ source: 'job', message: `Found ${items.length} batch items` });
  const startProcess = await start(configuration);
  let failed = 0;
  logger.info({ source: 'progress', message: 'Executing batch items', pageId: undefined, data: { value: 0, max: 0 } });
  let completed = 0;
  let lastLoggedCompleted: number | undefined;
  try {
    await parallelize((item) => batchTask(configuration, item), items, {
      parallel: configuration.parallel,
      on: (event) => {
        if (event.type === 'completed') {
          ++completed;
          if (event.input.statusCode !== 0) {
            ++failed;
          }
        } else if (event.type === 'failed') {
          ++failed;
          ++completed;
        }
        if (lastLoggedCompleted !== completed) {
          lastLoggedCompleted = completed;
          logger.info({
            source: 'progress',
            message: 'Executing batch items',
            pageId: undefined,
            data: { value: completed, max: items.length }
          });
        }
      }
    });
  } finally {
    await startProcess?.kill();
  }
  await saveReport(configuration, await buildBatchReport(items, configuration));
  logger.info({
    source: 'job',
    message: `Batch items completed: passed=${completed - failed} failed=${failed} count=${completed} (${formatDuration(Date.now() - batchStart)})`
  });
  if (failed > 0) {
    Exit.code = -1;
  }
};
