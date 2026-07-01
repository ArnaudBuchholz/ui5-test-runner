import { describe, it, expect, beforeAll, vi, beforeEach } from 'vitest';
import { mock } from 'reserve';
import { FileSystem } from '../../platform/index.js';
import type { ILogStorage } from './ILogStorage.js';
import type { LogMetrics } from './LogMetrics.js';
import { buildREserveConfiguration } from './REserve.js';
import type { InternalLogAttributes } from '../../platform/logger/types.js';

const storage = {
  length: 147,
  add: vi.fn(),
  fetch: vi.fn().mockReturnValue([])
} satisfies ILogStorage;

const fakeMetrics = {
  inputSize: 123,
  chunksCount: 456,
  outputSize: 789,
  minTimestamp: 1000,
  maxTimestamp: 2000,
  logCount: 987,
  reading: true
} satisfies LogMetrics;

let server: ReturnType<typeof mock>;
let abortController: AbortController;

beforeAll(async () => {
  abortController = new AbortController();
  vi.spyOn(abortController, 'abort');
  server = mock(buildREserveConfiguration(storage, fakeMetrics, abortController));
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  server.on('ready', () => resolve()).on('error', (error) => reject(error));
  vi.mocked(FileSystem.readFile).mockResolvedValue('code');
  await promise;
});

beforeEach(() => vi.clearAllMocks());

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
      // eslint-disable-next-line @typescript-eslint/no-base-to-string -- because of REserve
      const { metrics, logs } = JSON.parse(response.toString()) as {
        metrics: LogMetrics;
        logs: InternalLogAttributes[];
      };
      expect(metrics).toStrictEqual(fakeMetrics);
      expect(Array.isArray(logs)).toStrictEqual(true);
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
