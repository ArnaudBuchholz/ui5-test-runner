import { logger } from './platform/index.js';
import type { Server } from 'reserve';

export const logReserve = (server: Server) => {
  server
    .on('created', () => {
      logger.debug({ source: 'reserve', message: 'created', data: {} });
    })
    .on('ready', (event) => {
      const { eventName: message, ...data } = event;
      logger.debug({ source: 'reserve', message, data });
      logger.info({ source: 'server', message: `Server listening on: ${event.url}` });
    })
    .on('error', (event) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- REserve uses any
      const { eventName: message, reason: error, ...data } = event;
      logger.debug({ source: 'reserve', message, data, error });
    });
  for (const eventName of ['incoming', 'redirecting', 'redirected', 'aborted', 'closed'] as const) {
    server.on(eventName, (event) => {
      const { eventName: message, ...data } = event;
      logger.debug({ source: 'reserve', message, data });
    });
  }
};
