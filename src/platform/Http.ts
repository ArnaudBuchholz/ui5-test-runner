import { logger } from './logger.js';
import { Exit } from './Exit.js';

let _lastRequestId = 0;

interface FetchInit extends RequestInit {
  requestId?: number;
  controller?: AbortController;
}

const _fetch = async (url: string, init?: FetchInit): Promise<Response> => {
  const { requestId = ++_lastRequestId, controller = new AbortController(), ...fetchInit } = init ?? {};
  const loggedInit = Object.keys(fetchInit).length > 0 ? fetchInit : undefined;
  using _ = Exit.registerAsyncTask({
    name: `http.fetch#${requestId}`,
    stop: () => controller.abort()
  });
  logger.debug({ source: 'http', message: `${fetchInit?.method ?? 'GET'} ${url}`, data: { requestId, init: loggedInit } });
  try {
    const response = await fetch(url, {
      ...fetchInit,
      signal: controller.signal
    });
    const headers: Record<string, string | string[]> = Object.fromEntries(response.headers);
    logger.debug({
      source: 'http',
      message: `${response.status} ${response.statusText}`,
      data: { requestId, status: response.status, headers }
    });
    return response;
  } catch (error) {
    logger.debug({ source: 'http', message: 'error caught', data: { requestId }, error });
    throw error;
  }
};

export const Http = {
  async fetch(url: string, init?: RequestInit): Promise<Response> {
    return _fetch(url, init);
  },

  async getAsText(url: string): Promise<string> {
    const requestId = ++_lastRequestId;
    const controller = new AbortController();
    const response = await _fetch(url, { method: 'GET', requestId, controller });
    if (!response.ok) {
      throw new Error('HTTP request failed');
    }
    using _ = Exit.registerAsyncTask({
      name: `http.getAsText#${requestId}`,
      stop: () => controller.abort()
    });    
    const text = await response.text();
    logger.debug({ source: 'http', message: text, data: { requestId } });
    return text;
  }
};
