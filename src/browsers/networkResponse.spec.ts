import { it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../platform/index.js';
import { handleNetworkResponse } from './networkResponse.js';

const PAGE_ID = 1;
const URL = 'https://example.com/resource';
const METHOD = 'GET';
const REQUEST_HEADERS = { accept: 'application/json' };
const RESPONSE_HEADERS = { 'content-type': 'application/json' };

beforeEach(() => vi.clearAllMocks());

for (const [status, method] of [
  [200, 'info'],
  [301, 'info'],
  [404, 'warn'],
  [500, 'error']
] as const) {
  it(`routes HTTP ${status} to logger.${method}`, () => {
    handleNetworkResponse(PAGE_ID, URL, METHOD, status, REQUEST_HEADERS, RESPONSE_HEADERS);
    expect(logger[method]).toHaveBeenCalledWith({
      source: 'browser/network',
      message: URL,
      pageId: PAGE_ID,
      data: {
        request: { method: METHOD, headers: REQUEST_HEADERS },
        response: { status, headers: RESPONSE_HEADERS }
      }
    });
  });
}

it('routes unknown status codes to logger.info', () => {
  handleNetworkResponse(PAGE_ID, URL, METHOD, 0, REQUEST_HEADERS, RESPONSE_HEADERS);
  expect(logger.info).toHaveBeenCalledWith({
    source: 'browser/network',
    message: URL,
    pageId: PAGE_ID,
    data: {
      request: { method: METHOD, headers: REQUEST_HEADERS },
      response: { status: 0, headers: RESPONSE_HEADERS }
    }
  });
});
