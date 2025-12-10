import { it, expect, vi, beforeAll } from 'vitest';
import { Platform } from '../Platform.js';
import { MAX_BUFFER_SIZE, workerMain } from './allCompressed.js';
import type { LogMessage } from './types.js';
import { LogLevel } from './types.js';
import type { Configuration } from '../configuration/Configuration.js';

// Must be done before importing ./logger.ts
vi.hoisted(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-10-30T21:56:00.000Z'));
});

beforeAll(() => {
  Object.assign(Platform, { isMainThread: false }); // This worker is not in the main thread
  workerMain({ configuration: { cwd: './tmp' } } as { configuration: Configuration });
});

const channel = Platform.createBroadcastChannel('logger');

it('opens a broadcast channel to communicate with the logger instances', () => {
  expect(Platform.createBroadcastChannel).toBeCalledTimes(2);
  for (let n = 1; n <= 2; ++n) {
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
  expect(channel.postMessage).toHaveBeenCalledWith({ command: 'ready', source: 'allCompressed' } satisfies LogMessage);
});

it('flushes the traces after a timeout', () => {
  vi.advanceTimersToNextTimer(); // flush buffer
  const gzipStream = Platform.createGzip();
  vi.mocked(gzipStream.write).mockClear();
  channel.postMessage({
    command: 'log',
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: process.pid,
    threadId: Platform.threadId,
    isMainThread: false,
    source: 'job',
    message: 'test'
  });
  vi.advanceTimersToNextTimer(); // flush buffer
  expect(gzipStream.write).toHaveBeenCalled();
});

it('compress the traces before zipping (no data)', () => {
  vi.advanceTimersToNextTimer(); // flush buffer
  const gzipStream = Platform.createGzip();
  vi.mocked(gzipStream.write).mockClear();
  channel.postMessage({
    command: 'log',
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: process.pid,
    threadId: Platform.threadId,
    isMainThread: true, // for coverage
    source: 'job',
    message: 'test'
  });
  vi.advanceTimersToNextTimer(); // flush buffer
  expect(gzipStream.write).toHaveBeenCalledWith(expect.any(String));
});

it('compress the traces before zipping (data)', () => {
  vi.advanceTimersToNextTimer(); // flush buffer
  const gzipStream = Platform.createGzip();
  vi.mocked(gzipStream.write).mockClear();
  channel.postMessage({
    command: 'log',
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: process.pid,
    threadId: Platform.threadId,
    isMainThread: Platform.isMainThread,
    source: 'job',
    message: 'test',
    data: { hello: 'world' }
  });
  vi.advanceTimersToNextTimer(); // flush buffer
  expect(gzipStream.write).toHaveBeenCalled();
  const stringified = (vi.mocked(gzipStream.write).mock.calls[0] as [string, unknown])[0];
  const parsed = JSON.parse(stringified) as [string, object];
  expect(parsed).toStrictEqual([expect.any(String), { hello: 'world' }]);
});

it('flushes traces after a threshold count', () => {
  vi.advanceTimersToNextTimer(); // flush buffer
  const gzipStream = Platform.createGzip();
  vi.mocked(gzipStream.write).mockClear();
  for (let index = 0; index < MAX_BUFFER_SIZE; ++index) {
    channel.postMessage({
      command: 'log',
      timestamp: Date.now(),
      level: LogLevel.info,
      processId: process.pid,
      threadId: Platform.threadId,
      isMainThread: Platform.isMainThread,
      source: 'job',
      message: 'test'
    });
  }
  expect(gzipStream.write).toHaveBeenCalledTimes(1);
});

it('closes everything when the terminate signal is received', () => {
  channel.postMessage({ command: 'terminate' });
  expect(channel.close).toHaveBeenCalled();
  const gzipStream = Platform.createGzip();
  expect(gzipStream.end).toHaveBeenCalled();
});
