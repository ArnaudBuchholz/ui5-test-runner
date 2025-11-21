import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Platform } from './Platform.js';
import { AssertionError } from 'node:assert';
import type { Configuration } from './configuration/Configuration.js';

vi.mock('./Platform.js', async () => {
  const channel = {
    postMessage: vi.fn(),
    onmessage: undefined as ((data: unknown) => void) | undefined,
    close: vi.fn()
  };
  const worker = new EventTarget();
  Object.assign(worker, {
    on: worker.addEventListener,
    postMessage: vi.fn()
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
  Object.assign(Platform, { isMainThread: false });
  vi.resetAllMocks();
  vi.resetModules();
  vi.useFakeTimers();
});

const postMessage = (channel: ReturnType<typeof Platform.createBroadcastChannel>, data: unknown) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  channel.onmessage({ data } as any);

describe('general', () => {
  it('opens a broadcast channel to communicate with the logger thread (!Platform.isMainThread)', async () => {
    await import('./logger.js');
    expect(Platform.createBroadcastChannel).toHaveBeenCalledWith('logger');
  });

  it('waits for start before opening a broadcast channel to communicate with the logger thread (Platform.isMainThread)', async () => {
    Object.assign(Platform, { isMainThread: true });
    await import('./logger.js');
    expect(Platform.createBroadcastChannel).not.toHaveBeenCalled();
  });

  it('attaches a listener to the channel', async () => {
    await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    expect(channel.onmessage).not.toBeUndefined();
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
    postMessage(channel, { ready: true });
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
    postMessage(channel, { ready: true });
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

  describe('error handling', () => {
    it('extracts error information', async () => {
      const { logger } = await import('./logger.js');
      const channel = Platform.createBroadcastChannel('logger');
      postMessage(channel, { ready: true });
      const error = new Error('error');
      logger.debug({ source: 'test', message: 'test', error });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'test',
          message: 'test',
          error: {
            name: 'Error',
            message: 'error',
            stack: expect.any(String)
          }
        })
      );
    });

    it('extracts cause', async () => {
      const { logger } = await import('./logger.js');
      const channel = Platform.createBroadcastChannel('logger');
      postMessage(channel, { ready: true });
      const error = new Error('error');
      error.cause = new Error('cause');
      logger.debug({ source: 'test', message: 'test', error });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'test',
          message: 'test',
          error: {
            name: 'Error',
            message: 'error',
            stack: expect.any(String),
            cause: {
              name: 'Error',
              message: 'cause',
              stack: expect.any(String)
            }
          }
        })
      );
    });

    it('supports AggregateError', async () => {
      const { logger } = await import('./logger.js');
      const channel = Platform.createBroadcastChannel('logger');
      postMessage(channel, { ready: true });
      const error = new AggregateError([new Error('error1'), new Error('error2')], 'aggregate error');
      logger.debug({ source: 'test', message: 'test', error });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'test',
          message: 'test',
          error: {
            name: 'AggregateError',
            message: 'aggregate error',
            stack: expect.any(String),
            errors: [
              {
                name: 'Error',
                message: 'error1',
                stack: expect.any(String)
              },
              {
                name: 'Error',
                message: 'error2',
                stack: expect.any(String)
              }
            ]
          }
        })
      );
    });

    it('extrapolates error information', async () => {
      const { logger } = await import('./logger.js');
      const channel = Platform.createBroadcastChannel('logger');
      postMessage(channel, { ready: true });
      logger.debug({ source: 'test', message: 'test', error: 'string' });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'test',
          message: 'test',
          error: {
            name: 'Error',
            message: '"string"',
            stack: expect.any(String)
          }
        })
      );
    });
  });

  const levels = ['debug', 'info', 'warn', 'error', 'fatal'] as const;
  for (const level of levels) {
    it(`offers ${level} method that translates to ${level} trace level`, async () => {
      const { logger } = await import('./logger.js');
      const channel = Platform.createBroadcastChannel('logger');
      postMessage(channel, { ready: true });
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
    postMessage(channel, { terminate: true });
    expect(channel.close).toHaveBeenCalled();
  });
});

describe('Metrics automatic monitoring', () => {
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
    postMessage(channel, { terminate: true });
    vi.advanceTimersToNextTimer();
    expect(logger.debug).not.toHaveBeenCalled();
  });
});

const cwd = '~/test';

describe('open', () => {
  it('fails if not on the main thread', async () => {
    Object.assign(Platform, { isMainThread: false });
    const { logger } = await import('./logger.js');
    expect(() => logger.start({ cwd } as Configuration)).toThrowError(AssertionError);
    expect(Platform.createWorker).not.toHaveBeenCalled();
  });

  it('creates the logger worker', async () => {
    Object.assign(Platform, { isMainThread: true });
    const { logger } = await import('./logger.js');
    logger.start({ cwd } as Configuration);
    expect(Platform.createWorker).toHaveBeenCalledWith('logger', { configuration: { cwd } });
  });
});

describe('close', () => {
  it('fails if not on the main thread', async () => {
    const { logger } = await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    await expect(() => logger.stop()).rejects.toThrowError(AssertionError);
    expect(channel.postMessage).not.toHaveBeenCalled();
  });

  it('fails if open has not been called', async () => {
    Object.assign(Platform, { isMainThread: true });
    const { logger } = await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    await expect(() => logger.stop()).rejects.toThrowError(AssertionError);
    expect(channel.postMessage).not.toHaveBeenCalled();
  });

  it('closes the logger worker', async () => {
    Object.assign(Platform, { isMainThread: true });
    const { logger } = await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    const worker = Platform.createWorker('logger');
    logger.start({ cwd } as Configuration);
    const closing = logger.stop();
    (worker as unknown as EventTarget).dispatchEvent(new CustomEvent('exit'));
    await closing;
    expect(channel.postMessage).toHaveBeenCalledWith({ terminate: true });
  });
});
