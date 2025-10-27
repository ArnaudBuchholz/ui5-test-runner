import { it, expect, beforeEach, vi } from 'vitest';
import { Platform } from './Platform.js';

const PROCESS_ID = 42;
const THREAD_ID = 1;

vi.mock('./Platform.js', () => {
  const channel = { postMessage: vi.fn(), onmessage: undefined as any, close: vi.fn() };
  const Platform = {
    pid: PROCESS_ID,
    createBroadcastChannel: vi.fn(() => channel),
    createWorker: vi.fn(() => ({ on: vi.fn(), postMessage: vi.fn() })),
    isMainThread: false,
    threadId: THREAD_ID,
    threadCpuUsage: () => ({ cpu: 1 }),
    memoryUsage: () => ({ rss: 123 }),
  };
  return { Platform };
});

beforeEach(async () => {
  vi.resetAllMocks();
  vi.resetModules();
  vi.useFakeTimers();
});

it('opens a broadcast channel to communicate with the logger thread', async () => {
  await import('./logger.js');
  expect(Platform.createBroadcastChannel).toHaveBeenCalledWith('logger');
});

it('creates the logger worker when isMainThread is true', async () => {
  Object.assign(Platform, { isMainThread: true });
  await import('./logger.js');
  expect(Platform.createWorker).toHaveBeenCalledWith('logger');
});

it('does not create the logger worker when isMainThread is false', async () => {
  Object.assign(Platform, { isMainThread: false });
  await import('./logger.js');
  expect(Platform.createWorker).not.toHaveBeenCalledWith();
});

it('caches traces while waiting for the logger thread to start', async () => {
  const { logger } = await import('./logger.js');
  const channel = Platform.createBroadcastChannel('logger');
  logger.debug({ source: 'test', message: 'test' });
  expect(channel.postMessage).toHaveBeenCalledWith({ isReady: true });
  expect(channel.postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
    source: 'test',
    message: 'test',
  }));
});

it('sends traces when the logger thread starts', async () => {
  const { logger } = await import('./logger.js');
  const channel = Platform.createBroadcastChannel('logger');
  logger.debug({ source: 'test', message: 'test' });
  channel.onmessage({ data: { ready: true }} as any);
  expect(channel.postMessage).toHaveBeenCalledWith(expect.objectContaining({
    source: 'test',
    message: 'test',
  }));
});

it('augment traces with contextual information', async () => {
  const { logger } = await import('./logger.js');
  const channel = Platform.createBroadcastChannel('logger');
  channel.onmessage({ data: { ready: true }} as any);
  logger.debug({ source: 'test', message: 'test' });
  expect(channel.postMessage).toHaveBeenCalledWith(expect.objectContaining({
    timestamp: expect.any(Number),
    level: 'info',
    processId: process.pid,
    threadId: Platform.threadId,
    isMainThread: Platform.isMainThread,
    source: 'test',
    message: 'test',
  }));
});

it('closes the broadcast channel when the terminate signal is received', async () => {
  await import('./logger.js');
  const channel = Platform.createBroadcastChannel('logger');
  channel.onmessage({ data: { terminate: true }} as any);
  expect(channel.close).toHaveBeenCalled();
});
