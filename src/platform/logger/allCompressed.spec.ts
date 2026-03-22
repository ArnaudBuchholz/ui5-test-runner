import { it, expect, vi, beforeAll } from 'vitest';
import { Host, Thread, ZLib } from '../index.js';
import { MAX_BUFFER_COUNT, workerMain } from './allCompressed.js';
import type { LogMessage } from './types.js';
import { LogLevel } from './types.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { FramedStreamWriter } from '../../utils/FramedStreamWriter.js';

const stream = {
  write: vi.fn(),
  end: vi.fn()
};

vi.spyOn(FramedStreamWriter, 'create').mockImplementation(() => stream);

// Must be done before importing ./logger.ts
vi.hoisted(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-10-30T21:56:00.000Z'));
});

vi.spyOn(ZLib, 'deflateRawSync').mockReturnValue(Buffer.from('compressed'));

beforeAll(() => {
  Object.assign(Thread, { isMainThread: false }); // This worker is not in the main thread
  workerMain({ configuration: { reportDir: './tmp' } } as { configuration: Configuration });
});

const channel = Thread.createBroadcastChannel('logger');

it('opens a broadcast channel to communicate with the logger instances', () => {
  expect(Thread.createBroadcastChannel).toHaveBeenCalledTimes(2);
  for (let n = 1; n <= 2; ++n) {
    expect(Thread.createBroadcastChannel).toHaveBeenNthCalledWith(n, 'logger');
  }
});

it('creates a framed stream', () => {
  expect(FramedStreamWriter.create).toHaveBeenCalledWith('tmp/app-20251030-215600.log.gz');
});

it('broadcasts an initial { ready: true }', () => {
  expect(channel.postMessage).toHaveBeenCalledWith({ command: 'ready', source: 'allCompressed' } satisfies LogMessage);
});

it('flushes the traces after a timeout', async () => {
  vi.advanceTimersToNextTimer(); // flush buffer
  stream.write.mockClear();
  vi.mocked(ZLib.deflateRawSync).mockClear();
  channel.postMessage({
    command: 'log',
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: Host.pid,
    threadId: Thread.threadId,
    isMainThread: false,
    source: 'job',
    message: 'test'
  });
  await vi.runOnlyPendingTimersAsync();
  expect(ZLib.deflateRawSync).toHaveBeenCalled();
  expect(stream.write).toHaveBeenCalledWith(Buffer.from('compressed'));
});

it('compress the traces before zipping (no data)', async () => {
  vi.advanceTimersToNextTimer(); // flush buffer
  stream.write.mockClear();
  vi.mocked(ZLib.deflateRawSync).mockClear();
  channel.postMessage({
    command: 'log',
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: process.pid,
    threadId: Thread.threadId,
    isMainThread: true, // for coverage
    source: 'job',
    message: 'test'
  });
  vi.advanceTimersToNextTimer(); // flush buffer
  await vi.runOnlyPendingTimersAsync();
  expect(ZLib.deflateRawSync).toHaveBeenCalledWith(expect.any(String), { level: ZLib.constants.Z_BEST_COMPRESSION });
  expect(stream.write).toHaveBeenCalled();
});

it('flushes traces after a threshold count', async () => {
  vi.advanceTimersToNextTimer(); // flush buffer
  stream.write.mockClear();
  vi.mocked(ZLib.deflateRawSync).mockClear();
  for (let index = 0; index < MAX_BUFFER_COUNT - 1; ++index) {
    channel.postMessage({
      command: 'log',
      timestamp: Date.now(),
      level: LogLevel.info,
      processId: process.pid,
      threadId: Thread.threadId,
      isMainThread: Thread.isMainThread,
      source: 'job',
      message: 'test'
    });
  }
  expect(stream.write).not.toHaveBeenCalled();
  channel.postMessage({
    command: 'log',
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: process.pid,
    threadId: Thread.threadId,
    isMainThread: Thread.isMainThread,
    source: 'job',
    message: 'test'
  });
  await vi.runOnlyPendingTimersAsync();
  expect(stream.write).toHaveBeenCalled();
});

it('closes everything when the terminate signal is received', async () => {
  channel.postMessage({ command: 'terminate' });
  await vi.runOnlyPendingTimersAsync();
  expect(channel.close).toHaveBeenCalled();
  expect(stream.end).toHaveBeenCalled();
});
