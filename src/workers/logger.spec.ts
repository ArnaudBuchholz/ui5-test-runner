import { it, expect, vi } from 'vitest';
import { Platform } from '../Platform.js';
import { MAX_BUFFER_SIZE } from './logger.js';

// Must be done before importing ./logger.ts
vi.hoisted(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-10-30T21:56:00.000Z'));
});

vi.mock('../Platform.js', async (importActual) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- TODO: understand the error
  const actual = await importActual<typeof import('../Platform.js')>();
  const channel = {
    postMessage: vi.fn(),
    onmessage: undefined as ((data: unknown) => void) | undefined,
    close: vi.fn()
  };
  const writeStream = {};
  const gzipStream = {
    pipe: vi.fn(),
    write: vi.fn(),
    end: vi.fn()
  };
  const Platform = {
    ...actual.Platform,
    createBroadcastChannel: vi.fn(() => channel),
    workerData: { cwd: './tmp' },
    createWriteStream: vi.fn(() => writeStream),
    createGzip: vi.fn(() => gzipStream)
  };
  return { Platform };
});

const channel = Platform.createBroadcastChannel('logger');
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Simpler this way
const postMessage = (data: unknown) => channel.onmessage({ data } as any);

it('opens a broadcast channel to communicate with the logger instances', async () => {
  expect(Platform.createBroadcastChannel).toBeCalledTimes(3);
  for (let n = 1; n <= 3; ++n) {
    expect(Platform.createBroadcastChannel).toHaveBeenNthCalledWith(n, 'logger');
  }
});

it('creates a gzip file', () => {
  expect(Platform.createWriteStream).toHaveBeenCalledWith('tmp/app-20251030-215600.log.gz');
  const writeStream = Platform.createWriteStream('');
  expect(Platform.createGzip).toHaveBeenCalledWith({ flush: Platform.Z_FULL_FLUSH });
  const gzipStream = Platform.createGzip();
  expect(gzipStream.pipe).toHaveBeenCalledWith(writeStream);
});

it('broadcasts an initial { ready: true }', () => {
  expect(channel.postMessage).toHaveBeenCalledWith({ ready: true });
});

it('answers isReady by posting { ready: true }', () => {
  postMessage({ from: 'me', isReady: true });
  expect(channel.postMessage).toHaveBeenCalledWith({ from: 'me', isReady: true, ready: true });
});

it('flushes the traces after a timeout', () => {
  vi.advanceTimersToNextTimer(); // flush buffer
  const gzipStream = Platform.createGzip();
  vi.mocked(gzipStream.write).mockClear();
  postMessage({
    timestamp: Date.now(),
    level: 'info',
    processId: process.pid,
    threadId: Platform.threadId,
    isMainThread: false,
    source: 'test',
    message: 'test'
  });
  vi.advanceTimersToNextTimer(); // flush buffer
  expect(gzipStream.write).toHaveBeenCalled();
});

it('compress the traces before zipping (no data)', () => {
  vi.advanceTimersToNextTimer(); // flush buffer
  const gzipStream = Platform.createGzip();
  vi.mocked(gzipStream.write).mockClear();
  postMessage({
    timestamp: Date.now(),
    level: 'info',
    processId: process.pid,
    threadId: Platform.threadId,
    isMainThread: true, // for coverage
    source: 'test',
    message: 'test'
  });
  vi.advanceTimersToNextTimer(); // flush buffer
  expect(gzipStream.write).toHaveBeenCalledWith(expect.any(String));
});

it('compress the traces before zipping (data)', () => {
  vi.advanceTimersToNextTimer(); // flush buffer
  const gzipStream = Platform.createGzip();
  vi.mocked(gzipStream.write).mockClear();
  postMessage({
    timestamp: Date.now(),
    level: 'info',
    processId: process.pid,
    threadId: Platform.threadId,
    isMainThread: Platform.isMainThread,
    source: 'test',
    message: 'test',
    data: { hello: 'world' }
  });
  vi.advanceTimersToNextTimer(); // flush buffer
  expect(gzipStream.write).toHaveBeenCalled();
  const stringified = (vi.mocked(gzipStream.write).mock.calls[0] as [string, unknown])[0];
  const parsed = JSON.parse(stringified);
  expect(parsed).toStrictEqual([expect.any(String), { hello: 'world' }]);
});

it('flushes traces after a threshold count', () => {
  vi.advanceTimersToNextTimer(); // flush buffer
  const gzipStream = Platform.createGzip();
  vi.mocked(gzipStream.write).mockClear();
  for (let index = 0; index < MAX_BUFFER_SIZE; ++index) {
    postMessage({
      timestamp: Date.now(),
      level: 'info',
      processId: process.pid,
      threadId: Platform.threadId,
      isMainThread: Platform.isMainThread,
      source: 'test',
      message: 'test'
    });
  }
  expect(gzipStream.write).toHaveBeenCalledTimes(1);
});

it('closes everything when the terminate signal is received', () => {
  postMessage({ terminate: true });
  expect(channel.close).toHaveBeenCalled();
  const gzipStream = Platform.createGzip();
  expect(gzipStream.end).toHaveBeenCalled();
});
