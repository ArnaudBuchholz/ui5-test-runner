import { logger, Exit, logEnvironnement } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { parallelize } from '../../utils/shared/parallelize.js';
import { start } from '../../start.js';
import { resolve } from './resolve.js';
import { batchTask } from './batchTask.js';
import { buildBatchReport } from './report.js';
import { defaults } from '../../configuration/options.js';
import { redactSecrets } from '../../utils/node/anonymize.js';
import { toPlainObject } from '../../utils/shared/object.js';
import { Folder } from '../../utils/node/Folder.js';
import { saveReport } from '../../reports/saveReport.js';
import { formatDuration } from '../../utils/shared/string.js';
import { end } from '../../end.js';
import { printBatchOutput } from './output.js';

export const batch = async (configuration: Configuration): Promise<void> => {
  const batchStart = Date.now();
  await Folder.create(configuration.reportDir);
  await logger.start(configuration);
  logger.debug({
    source: 'job',
    message: 'configuration',
    data: { defaults, configuration: redactSecrets(toPlainObject(configuration)) }
  });
  if (!configuration.noBanner) {
    await logEnvironnement();
  }
  logger.info({ source: 'progress', message: 'resolving batch items', pageId: undefined, data: { value: 0, max: 0 } });
  const items = await resolve(configuration);
  if (items.length === 0) {
    logger.warn({ source: 'job', message: 'no batch items found' });
    return;
  }
  logger.info({ source: 'job', message: `Found ${items.length} batch items` });
  const startProcess = await start(configuration);
  let failed = 0;
  logger.info({ source: 'progress', message: 'executing batch items', pageId: undefined, data: { value: 0, max: 0 } });
  let completed = 0;
  let lastLoggedCompleted: number | undefined;
  const started = new Set<number>();
  try {
    await parallelize(
      async function (item) {
        const result = await batchTask(configuration, item, batchStart);
        if (configuration.failFast && (result.statusCode !== 0 || result.timedOut)) {
          for (const [queuedIndex, queuedItem] of items.entries()) {
            if (started.has(queuedIndex)) {
              continue;
            }
            queuedItem.skipped = true;
            queuedItem.message = 'batch item not executed (fail-fast)';
          }
          // eslint-disable-next-line unicorn/no-this-outside-of-class -- parallelize binds its cancellation context
          this.stop(new Error(`batch item failed: ${result.id}`));
        }
        return result;
      },
      items,
      {
        parallel: configuration.parallel,
        on: (event) => {
          if (event.type === 'started') {
            started.add(event.index);
          } else if (event.type === 'completed') {
            ++completed;
            if (event.input.statusCode !== 0 || event.input.timedOut) {
              ++failed;
            }
          } else if (event.type === 'failed') {
            ++failed;
            ++completed;
          }
          if (lastLoggedCompleted === completed) {
            return;
          }

          lastLoggedCompleted = completed;
          logger.info({
            source: 'progress',
            message: 'executing batch items',
            pageId: undefined,
            data: { value: completed, max: items.length }
          });
        }
      }
    );
  } finally {
    await startProcess?.kill();
  }
  await saveReport(configuration, await buildBatchReport(items, configuration));
  if (configuration.batchOutput) {
    await printBatchOutput(items);
  }
  logger.info({
    source: 'job',
    message: `Batch items completed: passed=${completed - failed} failed=${failed} count=${completed} (${formatDuration(Date.now() - batchStart)})`
  });
  if (failed > 0) {
    Exit.code = -1;
  }
  await end(configuration);
};
