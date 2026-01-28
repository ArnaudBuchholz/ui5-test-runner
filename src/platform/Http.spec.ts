import { it, expect, vi, beforeEach, describe } from 'vitest';
import type { Http as HttpType } from './Http.js';
import { Exit } from './Exit.js';
import { logger } from './logger.js';
import { __lastRegisteredExitAsyncTask } from './mock.js';
const { Http } = await vi.importActual<{ Http: typeof HttpType }>('./Http.js');

const URL = 'http://localhost/test';

const { unregister } = Exit.registerAsyncTask({
  name: 'test',
  stop: vi.fn()
});

const abortController = {
  abort: vi.fn(),
  signal: {} as AbortSignal
};
globalThis.AbortController = vi.fn(function () {
  return abortController;
});

const response = {
  ok: true,
  status: 200,
  statusText: 'status200',
  headers: [['content-type', 'application/json']],
  text: () => Promise.resolve('responseText')
};
globalThis.fetch = vi.fn().mockResolvedValue(response);

beforeEach(() => vi.clearAllMocks());

describe('asynchronous task', () => {
  it('registers itself as an async task', async () => {
    await Http.get(URL);
    expect(Exit.registerAsyncTask).toHaveBeenCalledWith({
      name: expect.stringMatching(/^http.get#\d+$/) as string,
      stop: expect.any(Function) as () => void
    });
    expect(unregister).toHaveBeenCalledOnce();
  });

  it('passes an AbortController signal the request', async () => {
    await Http.get(URL);
    expect(fetch).toHaveBeenCalledWith(URL, {
      signal: abortController.signal
    });
  });

  it('uses an AbortController to stop the request', async () => {
    await Http.get(URL);
    expect(abortController.abort).not.toHaveBeenCalled();
    await __lastRegisteredExitAsyncTask.stop();
    expect(abortController.abort).toHaveBeenCalled();
  });
});

describe('logging', () => {
  it('documents the request', async () => {
    await Http.get(URL);
    expect(logger.debug).toHaveBeenCalledWith({
      source: 'http',
      message: `GET ${URL}`,
      data: { requestId: expect.any(Number) as number }
    });
  });

  it('documents the response', async () => {
    await Http.get(URL);
    expect(logger.debug).toHaveBeenCalledWith({
      source: 'http',
      message: `200 status200`,
      data: {
        requestId: expect.any(Number) as number,
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      }
    });
  });

  it('documents the response content', async () => {
    await Http.get(URL);
    expect(logger.debug).toHaveBeenCalledWith({
      source: 'http',
      message: `responseText`,
      data: { requestId: expect.any(Number) as number }
    });
  });

  describe('error handling', () => {
    it('document response error', async () => {
      const error = new Error('fetch() failed');
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(error);
      await expect(Http.get(URL)).rejects.toThrowError(error);
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'http',
        message: `error caught`,
        data: { requestId: expect.any(Number) as number },
        error
      });
    });

    it('document response error (!ok)', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'status500',
        headers: [['content-type', 'application/json']],
        text: () => expect.unreachable()
      } as unknown as Response);
      const error = new Error('HTTP request failed');
      await expect(Http.get(URL)).rejects.toThrowError(error);
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'http',
        message: `error caught`,
        data: { requestId: expect.any(Number) as number },
        error
      });
    });

    it('document response content error', async () => {
      const error = new Error('text() failed');
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'status200',
        headers: [['content-type', 'application/json']],
        text: () => Promise.reject(error)
      } as unknown as Response);
      await expect(Http.get(URL)).rejects.toThrowError(error);
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'http',
        message: `error caught`,
        data: { requestId: expect.any(Number) as number },
        error
      });
    });
  });
});
