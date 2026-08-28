import type { Configuration } from '../../configuration/Configuration.js';
import { Exit, logger } from '../../platform/index.js';
import { serve } from 'reserve';
import { buildREserveConfiguration } from './reserve.js';
import { init } from './knowledgeBase.js';
import { logReserve } from '../../reserveLogger.js';

export const mcp = async (configuration: Configuration): Promise<void> => {
  await logger.start(configuration);
  await init(configuration);
  const { promise, resolve } = Promise.withResolvers<void>();
  const server = serve(buildREserveConfiguration(configuration));
  const stop = async () => {
    await server?.close();
    resolve();
  };
  Exit.registerAsyncTask({
    name: 'mcp',
    stop
  });
  logReserve(server);
  server.on('ready', () => {
    logger.info({ source: 'mcp', message: 'Use CTRL+C to end' });
  });
  server.on('error', ({ reason: error }) => {
    logger.error({ source: 'mcp', message: 'server error', error });
    void stop();
  });
  await promise;
};
