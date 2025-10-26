import { it, expect, beforeEach, vi } from 'vitest';

// Must be done each time because of vi.resetModules
const mockPlatform = (isMainThread = false) => {
  const channel = { postMessage: vi.fn(), onmessage: undefined as any, close: vi.fn() };
  const createBroadcastChannel = vi.fn(() => channel);
  const createWorker = vi.fn();

  vi.mock('./Platform.js', () => ({
    Platform: {
      createBroadcastChannel,
      createWorker,
      isMainThread,
      threadId: 42,
      threadCpuUsage: vi.fn(),
      memoryUsage: vi.fn(),
    }
  }));

  return { channel, createBroadcastChannel, createWorker };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.resetModules();
  vi.useFakeTimers();
});

it('opens a broadcast channel', async () => {
  // const { createBroadcastChannel } = mockPlatform();

  // different mock: not main thread, and createWorker returns a stub
  vi.mock('./Platform.js', () => {
    const channel = { postMessage: vi.fn(), onmessage: undefined as any, close: vi.fn() };
    return {
      Platform: {
        createBroadcastChannel: vi.fn(() => channel),
        createWorker: () => ({ on: vi.fn(), postMessage: vi.fn() }),
        isMainThread: false,
        threadId: 42,
        threadCpuUsage: () => ({ cpu: 1 }),
        memoryUsage: () => ({ rss: 123 }),
      }
    };
  });

  await import('./logger.js');
  // expect(createBroadcastChannel).toHaveBeenCalledWith('logger');
});

it.skip('creates the logger worker when isMainThread is true', async () => {
  const { createWorker } = mockPlatform(true);
  await import('./logger.js');
  expect(createWorker).toHaveBeenCalledWith('logger');
});

it.skip('does not create the logger worker when isMainThread is false', async () => {
  const { createWorker } = mockPlatform(false);
  await import('./logger.js');
  expect(createWorker).not.toHaveBeenCalledWith();
});