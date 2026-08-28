import type { Configuration } from '../../configuration/Configuration.js';
import { Exit, logger } from '../../platform/index.js';
import { serve } from 'reserve';
import { buildREserveConfiguration } from './reserve.js';
import { init } from './knowledgeBase.js';

export const mcp = async (configuration: Configuration): Promise<void> => {
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
  server.on('ready', ({ url }) => {
    logger.info({ source: 'mcp', message: `MCP server listening on ${url}mcp` });
  });
  server.on('error', ({ reason: error }) => {
    logger.error({ source: 'mcp', message: 'server error', error });
  });
  await promise;
};
