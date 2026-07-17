import { logger, Host } from '../../platform/index.js';

export const notifyProgress = (message: string, value: number, total: number): void => {
  logger.info({ source: 'progress', message, pageId: undefined, data: { value, max: total } });
  if (Host.env['UI5TR_BATCH_MODE'] && typeof process.send === 'function') {
    process.send({ type: 'progress', count: value, total });
  }
};
