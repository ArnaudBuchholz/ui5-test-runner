import { it, expect, vi, beforeEach, describe } from 'vitest';
import type { Http as HttpType } from './Http.js';
import { Exit } from './Exit.js';
import { logger } from './logger.js';
import { __lastRegisteredExitAsyncTask, __unregisterExitAsyncTask } from './mock.js';
const { Http } = await vi.importActual<{ Http: typeof HttpType }>('./Http.js');

const URL = 'http://localhost/test';
const RESPONSE_TEXT = 'responseText';

const abortController = {
  abort: vi.fn(),
  signal: {
    addEventListener: vi.fn()
  } as unknown as AbortSignal
};
globalThis.AbortController = vi.fn(function () {
  return abortController;
});

const response = {
  ok: true,
  status: 200,
  statusText: 'status200',
  headers: [['content-type', 'application/json']],
  text: () => Promise.resolve(RESPONSE_TEXT)
};
globalThis.fetch = vi.fn().mockResolvedValue(response);

beforeEach(() => vi.clearAllMocks());

describe('Http.fetch', () => {
  describe('asynchronous task', () => {
    it('registers itself as an async task', async () => {
      await Http.fetch(URL);
      expect(Exit.registerAsyncTask).toHaveBeenCalledWith({
        name: expect.stringMatching(/^http\.fetch#\d+$/) as string,
        stop: expect.any(Function) as () => void
      });
      expect(__unregisterExitAsyncTask).toHaveBeenCalledOnce();
    });

    it('passes the AbortController signal to the request', async () => {
      await Http.fetch(URL);
      expect(fetch).toHaveBeenCalledWith(URL, { signal: abortController.signal });
    });

    it('uses the AbortController to stop the request', async () => {
      await Http.fetch(URL);
      expect(abortController.abort).not.toHaveBeenCalled();
      await __lastRegisteredExitAsyncTask.stop();
      expect(abortController.abort).toHaveBeenCalled();
    });
  });

  describe('logging', () => {
    it('logs the request with default GET method', async () => {
      await Http.fetch(URL);
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'http',
        message: `GET ${URL}`,
        data: { requestId: expect.any(Number) as number, init: undefined }
      });
    });

    it('logs the request with a custom method', async () => {
      await Http.fetch(URL, { method: 'HEAD' });
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'http',
        message: `HEAD ${URL}`,
        data: { requestId: expect.any(Number) as number, init: { method: 'HEAD' } }
      });
    });

    it('logs the response status', async () => {
      await Http.fetch(URL);
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'http',
        message: `200 status200`,
        data: {
          requestId: expect.any(Number) as number,
          status: 200,
          headers: { 'content-type': 'application/json' }
        }
      });
    });

    it('logs and rethrows network errors', async () => {
      const error = new Error('fetch() failed');
      vi.mocked(globalThis.fetch).mockRejectedValueOnce(error);
      await expect(Http.fetch(URL)).rejects.toThrow(error);
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'http',
        message: 'error caught',
        data: { requestId: expect.any(Number) as number },
        error
      });
    });
  });

  describe('signal forwarding', () => {
    const addEventListenerMock = vi.fn();
    const removeEventListenerMock = vi.fn();
    const EXTERNAL_SIGNAL = {
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock
    } as unknown as AbortSignal;

    it('subscribes to the abort event on the provided signal', async () => {
      await Http.fetch(URL, { signal: EXTERNAL_SIGNAL });
      expect(addEventListenerMock).toHaveBeenCalledWith('abort', expect.any(Function) as () => void);
    });

    it('forwards the received abort signal to the inner controller', async () => {
      await Http.fetch(URL, { signal: EXTERNAL_SIGNAL });
      const [, abortForwarder] = addEventListenerMock.mock.calls[0]! as [string, () => void];
      abortForwarder();
      expect(abortController.abort).toHaveBeenCalled();
    });

    it('unsubscribes from the signal abort event after fetch completes', async () => {
      await Http.fetch(URL, { signal: EXTERNAL_SIGNAL });
      expect(removeEventListenerMock).toHaveBeenCalledWith('abort', expect.any(Function) as () => void);
    });
  });

  it('returns the Response object', async () => {
    const result = await Http.fetch(URL);
    expect(result).toBe(response);
  });

  it('merges provided init with the AbortController signal', async () => {
    await Http.fetch(URL, { method: 'POST', headers: { 'x-foo': 'bar' } });
    expect(fetch).toHaveBeenCalledWith(URL, {
      method: 'POST',
      headers: { 'x-foo': 'bar' },
      signal: abortController.signal
    });
  });
});

describe('Http.getAsText', () => {
  it('calls fetch with GET', async () => {
    await Http.getAsText(URL);
    expect(fetch).toHaveBeenCalledWith(URL, expect.objectContaining({ method: 'GET' }));
  });

  it('returns the response body as text', async () => {
    const text = await Http.getAsText(URL);
    expect(text).toBe(RESPONSE_TEXT);
  });

  it('logs the response body text', async () => {
    await Http.getAsText(URL);
    expect(logger.debug).toHaveBeenCalledWith({
      source: 'http',
      message: RESPONSE_TEXT,
      data: { requestId: expect.any(Number) as number }
    });
  });

  it('registers itself as an async task while getting the text if response is ok', async () => {
    await Http.getAsText(URL);
    expect(Exit.registerAsyncTask).toHaveBeenCalledWith({
      name: expect.stringMatching(/^http\.getAsText#\d+$/) as string,
      stop: expect.any(Function) as () => void
    });
    expect(__unregisterExitAsyncTask).toHaveBeenCalledTimes(2); // +1 for the _fetch
  });

  it('uses the AbortController to stop the text download', async () => {
    await Http.getAsText(URL);
    expect(abortController.abort).not.toHaveBeenCalled();
    await __lastRegisteredExitAsyncTask.stop();
    expect(abortController.abort).toHaveBeenCalled();
  });

  it('throws on non-ok response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'status500',
      headers: [['content-type', 'application/json']],
      text: () => expect.unreachable()
    } as unknown as Response);
    await expect(Http.getAsText(URL)).rejects.toThrow('HTTP request failed');
  });

  it('does not register itself as an async task on non-ok response', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'status500',
      headers: [['content-type', 'application/json']],
      text: () => expect.unreachable()
    } as unknown as Response);
    await expect(Http.getAsText(URL)).rejects.toThrow();
    expect(Exit.registerAsyncTask).not.toHaveBeenCalledWith({
      name: expect.stringMatching(/^http\.getAsText#\d+$/) as string,
      stop: expect.any(Function) as () => void
    });
  });

  it('throws when text() rejects', async () => {
    const error = new Error('text() failed');
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'status200',
      headers: [['content-type', 'application/json']],
      text: () => Promise.reject(error)
    } as unknown as Response);
    await expect(Http.getAsText(URL)).rejects.toThrow(error);
  });

  it('logs the body text on the same requestId as the request', async () => {
    await Http.getAsText(URL);
    const logDebugCalls = vi.mocked(logger.debug).mock.calls;
    const requestLog = logDebugCalls[0];
    expect.assert(requestLog !== undefined);
    expect.assert(requestLog[0].source === 'http');
    expect(requestLog[0].message).toContain(URL);
    const textLog = logDebugCalls[2]; // 1 is response log
    expect.assert(textLog !== undefined);
    expect.assert(textLog[0].source === 'http');
    expect(textLog[0].message).toStrictEqual(RESPONSE_TEXT);
    expect(requestLog[0].data.requestId).toStrictEqual(textLog[0].data.requestId);
  });
});
