import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';
import { mock } from 'reserve';
import { FileSystem } from '../../platform/index.js';
import type { ILogStorage } from './ILogStorage.js';
import type { LogMetrics } from './LogMetrics.js';
import { buildREserveConfiguration } from './REserve.js';

const storage = {
  length: 147,
  add: vi.fn(),
  fetch: vi.fn()
} satisfies ILogStorage;

const metrics = {
  inputSize: 123,
  chunksCount: 456,
  outputSize: 789
} satisfies LogMetrics;

let server: ReturnType<typeof mock>;
let abortController: AbortController;

beforeAll(async () => {
  abortController = new AbortController();
  vi.spyOn(abortController, 'abort');
  server = mock(buildREserveConfiguration(storage, metrics, abortController));
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  server.on('ready', () => resolve()).on('error', (error) => reject(error));
  vi.mocked(FileSystem.readFile).mockResolvedValue('code');
  await promise;
});

beforeEach(() => vi.clearAllMocks());

describe('adds metrics to the response as headers', () => {
  const metrics = {
    'x-metrics-chunks-count': '456',
    'x-metrics-input-size': '123',
    'x-metrics-output-size': '789',
    'x-metrics-logs-count': '147'
  } as const;

  let response: Awaited<ReturnType<(typeof server)['request']>>;

  beforeAll(async () => {
    response = await server.request('GET', '/query');
    await response.waitForFinish();
    expect(response.statusCode).toBe(200);
  });

  for (const [header, value] of Object.entries(metrics)) {
    it(`adds ${header}`, () => {
      expect(response.headers[header]).toStrictEqual(value);
    });
  }
});

describe('forwards parameters to the fetch api', () => {
  const queries = {
    '/query?from=1': { from: 1 },
    '/query?to=1': { to: 1 },
    '/query?skip=1': { skip: 1 },
    '/query?limit=1': { limit: 1 },
    [`/query?filter=${encodeURIComponent('level === "info"')}`]: { filter: 'level === "info"' },
    [`/query?from=123&to=456&skip=789&limit=1&filter=${encodeURIComponent('level === "error" && !!error')}`]: {
      from: 123,
      to: 456,
      skip: 789,
      limit: 1,
      filter: 'level === "error" && !!error'
    }
  } as const;

  for (const [url, query] of Object.entries(queries)) {
    it(url, async () => {
      const response = await server.request('GET', url);
      await response.waitForFinish();
      expect(response.statusCode).toBe(200);
      expect(storage.fetch).toHaveBeenCalledWith(query);
    });
  }
});

describe('log viewer application', () => {
  it('returns the log viewer code', async () => {
    const response = await server.request('GET', '/log-viewer.js');
    await response.waitForFinish();
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('application/javascript');
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- The way REserve provides response body
    expect(response.toString()).toStrictEqual('code');
  });

  it('returns the log viewer page', async () => {
    const response = await server.request('GET', '/');
    await response.waitForFinish();
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('text/html');
  });

  it('triggers the abort signal on close', async () => {
    const response = await server.request('GET', '/close');
    expect(response.statusCode).toBe(200);
    expect(abortController.abort).toHaveBeenCalled();
  });
});
