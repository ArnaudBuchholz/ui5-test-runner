import { logger } from '../platform/index.js';

const LOG_TYPES = [null, null, null, null, 'warn', 'error'] as const;

export const handleNetworkResponse = (
  pageId: number,
  url: string,
  method: string,
  status: number,
  requestHeaders: Record<string, string>,
  responseHeaders: Record<string, string>
): void => {
  const statusType = Math.floor(status / 100);
  const logType = LOG_TYPES[statusType] ?? 'info';
  logger[logType]({
    source: 'browser/network',
    message: url,
    pageId,
    data: {
      request: { method, headers: requestHeaders },
      response: { status, headers: responseHeaders }
    }
  });
};
