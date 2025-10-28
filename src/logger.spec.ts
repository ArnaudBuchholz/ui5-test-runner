import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Platform } from './Platform.js';
import { AssertionError } from 'node:assert';

vi.mock('./Platform.js', async () => {
  const channel = { postMessage: vi.fn(), onmessage: undefined as ((data: unknown) => void) | undefined, close: vi.fn() };
  const worker = new EventTarget();
  Object.assign(worker, {
    on: worker.addEventListener,
    postMessage: vi.fn(),
  });
  const Platform = {
    pid: Math.floor(Date.now() / 1000),
    createBroadcastChannel: vi.fn(() => channel),
    createWorker: vi.fn(() => worker),
    isMainThread: false,
    threadId: Math.floor(Date.now() / 1000) + 1,
    threadCpuUsage: () => ({ cpu: 1 }),
    memoryUsage: () => ({ rss: 123 })
  };
  return { Platform };
});

beforeEach(async () => {
  vi.resetAllMocks();
  vi.resetModules();
  vi.useFakeTimers();
});

describe('general', () => {
  it('opens a broadcast channel to communicate with the logger thread', async () => {
    await import('./logger.js');
    expect(Platform.createBroadcastChannel).toHaveBeenCalledWith('logger');
  });

  it('caches traces while waiting for the logger thread to start (and query for readyness)', async () => {
    const { logger } = await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    logger.debug({ source: 'test', message: 'test' });
    expect(channel.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'test',
        message: 'test'
      })
    );
    expect(channel.postMessage).toHaveBeenCalledWith({ isReady: true });
  });

  it('sends traces when the logger thread starts', async () => {
    const { logger } = await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    logger.debug({ source: 'test', message: 'test' });
    channel.onmessage({ data: { ready: true } } as any);
    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'test',
        message: 'test'
      })
    );
  });

  it('documents traces with contextual information', async () => {
    const { logger } = await import('./logger.js');
    const timestamp = Date.now(); // because of fake timers
    const channel = Platform.createBroadcastChannel('logger');
    channel.onmessage({ data: { ready: true } } as any);
    logger.debug({ source: 'test', message: 'test' });
    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp,
        level: 'debug',
        processId: Platform.pid,
        threadId: Platform.threadId,
        isMainThread: Platform.isMainThread,
        source: 'test',
        message: 'test'
      })
    );
  });

  const levels = ['debug', 'info', 'warn', 'error', 'fatal'] as const;
  for (const level of levels) {
    it(`offers ${level} method that translates to ${level} trace level`, async () => {
      const { logger } = await import('./logger.js');
      const channel = Platform.createBroadcastChannel('logger');
      channel.onmessage({ data: { ready: true } } as any);
      logger[level]({ source: 'test', message: 'test' });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          level
        })
      );
    });
  }

  it('closes the broadcast channel when the terminate signal is received', async () => {
    await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    channel.onmessage({ data: { terminate: true } } as any);
    expect(channel.close).toHaveBeenCalled();
  });

  it('monitors thread metrics automatically', async () => {
    const { logger } = await import('./logger.js');
    vi.spyOn(logger, 'debug');
    vi.advanceTimersToNextTimer();
    expect(logger.debug).toHaveBeenCalledWith({
      source: 'metric',
      message: 'threadCpuUsage',
      data: Platform.threadCpuUsage()
    });
    expect(logger.debug).toHaveBeenCalledWith({
      source: 'metric',
      message: 'memoryUsage',
      data: Platform.memoryUsage()
    });
  });

  it('stops monitoring thread metrics the terminate signal is received', async () => {
    const { logger } = await import('./logger.js');
    vi.spyOn(logger, 'debug');
    const channel = Platform.createBroadcastChannel('logger');
    channel.onmessage({ data: { terminate: true } } as any);
    vi.advanceTimersToNextTimer();
    expect(logger.debug).not.toHaveBeenCalled();
  });
});

const cwd = '/~/test';

describe('open', () => {
  it('fails if not on the main thread', async () => {
    Object.assign(Platform, { isMainThread: false });
    const { logger } = await import('./logger.js');
    expect(() => logger.open(cwd)).toThrowError(AssertionError);
    expect(Platform.createWorker).not.toHaveBeenCalled();
  });

  it('creates the logger worker if on the main thread', async () => {
    Object.assign(Platform, { isMainThread: true });
    const { logger } = await import('./logger.js');
    logger.open(cwd);
    expect(Platform.createWorker).toHaveBeenCalledWith('logger', { cwd });
  });
});

describe('close', () => {
  it('fails if not on the main thread', async () => {
    Object.assign(Platform, { isMainThread: false });
    const { logger } = await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    await expect(() => logger.close()).rejects.toThrowError(AssertionError);
    expect(channel.postMessage).not.toHaveBeenCalled();
  });

  it('fails if open has not been called', async () => {
    Object.assign(Platform, { isMainThread: true });
    const { logger } = await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    await expect(() => logger.close()).rejects.toThrowError(AssertionError);
    expect(channel.postMessage).not.toHaveBeenCalled();
  });

  it('closes the logger worker if on the main thread', async () => {
    Object.assign(Platform, { isMainThread: true });
    const { logger } = await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    const worker = Platform.createWorker('logger');
    logger.open(cwd);
    const closing = logger.close();
    worker.emit('exit');
    await closing;
    expect(channel.postMessage).toHaveBeenCalledWith({ terminate: true });
  });
});
