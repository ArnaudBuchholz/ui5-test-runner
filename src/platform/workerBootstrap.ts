import { workerData } from 'node:worker_threads';
import { logger } from './logger.js';

const main = async () => {
  const { path, data } = workerData as { path: string; data: unknown };
  logger.debug({ source: 'thread', message: `Worker starting...`, data: { path, data } });
  const { workerMain } = (await import(path)) as { workerMain: (data: unknown) => void | Promise<void> };
  try {
    await workerMain(data);
  } catch (error) {
    logger.fatal({ source: 'thread', message: `An error occurred`, error, data: { path } });
  } finally {
    logger.debug({
      source: 'thread',
      message: `Main completed (it does not mean the worker is offline)`,
      data: { path }
    });
  }
};

void main();
