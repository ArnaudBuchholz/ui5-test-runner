import { logger } from './logger.js';
import { Exit } from './Exit.js';

let lastRequestId = 0;

export const Http = {
  async get(url: string): Promise<string> {
    const requestId = ++lastRequestId;
    const controller = new AbortController();
    const task = Exit.registerAsyncTask({
      name: `http.get#${requestId}`,
      stop: () => controller.abort()
    });
    logger.debug({ source: 'http', message: `GET ${url}`, data: { requestId } });
    try {
      const response = await fetch(url, {
        signal: controller.signal
      });
      const headers: Record<string, string | string[]> = {};
      for (const [name, value] of response.headers) {
        headers[name] = value;
      }
      logger.debug({
        source: 'http',
        message: `${response.status} ${response.statusText}`,
        data: { requestId, status: response.status, headers }
      });
      if (!response.ok) {
        throw new Error('HTTP request failed');
      }
      const text = await response.text();
      logger.debug({ source: 'http', message: text, data: { requestId } });
      return text;
    } catch (error) {
      logger.debug({ source: 'http', message: 'error caught', data: { requestId }, error });
      throw error;
    } finally {
      task.unregister();
    }
  }
};
