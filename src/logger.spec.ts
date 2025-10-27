import { it, expect, beforeEach, vi } from 'vitest';
import { Platform } from './Platform.js';

vi.mock('./Platform.js', () => {
  const channel = { postMessage: vi.fn(), onmessage: undefined as any, close: vi.fn() };
  const Platform = {
    createBroadcastChannel: vi.fn(() => channel),
    createWorker: vi.fn(() => ({ on: vi.fn(), postMessage: vi.fn() })),
    isMainThread: false,
    threadId: 42,
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

it('opens a broadcast channel', async () => {
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
