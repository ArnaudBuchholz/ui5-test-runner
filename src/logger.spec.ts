import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Platform } from './Platform.js';
import { AssertionError } from 'node:assert';
import type { Configuration } from './configuration/Configuration.js';
import { LogLevel } from './logger/types.js';
import type { LogMessage } from './logger/types.js';

const expectAnyString = expect.any(String) as string;
const expectAnyNumber = expect.any(Number) as number;

// TODO: the main thread waits for the two outputs to be ready *before* sending the logs
// TODO: the other threads do not wait (because started from the main thread)

beforeEach(() => {
  Object.assign(Platform, { isMainThread: false });
  vi.resetAllMocks();
  vi.resetModules();
  vi.useFakeTimers();
});

const postMessage = (channel: ReturnType<typeof Platform.createBroadcastChannel>, data: LogMessage) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  channel.onmessage({ data } as any);

const ready = (channel: ReturnType<typeof Platform.createBroadcastChannel>) => {
  postMessage(channel, { command: 'ready', source: 'allCompressed' });
  postMessage(channel, { command: 'ready', source: 'output' });
};

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
    logger.debug({ source: 'job', message: 'test' });
    expect(channel.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'job',
        message: 'test'
      })
    );
  });

  it('sends traces when the logger thread starts', async () => {
    const { logger } = await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    logger.debug({ source: 'job', message: 'test' });
    ready(channel);
    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'job',
        message: 'test'
      })
    );
  });

  it('documents traces with contextual information', async () => {
    const { logger } = await import('./logger.js');
    const timestamp = Date.now(); // because of fake timers
    const channel = Platform.createBroadcastChannel('logger');
    ready(channel);
    logger.debug({ source: 'job', message: 'test' });
    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp,
        level: LogLevel.debug,
        processId: Platform.pid,
        threadId: Platform.threadId,
        isMainThread: Platform.isMainThread,
        source: 'job',
        message: 'test'
      })
    );
  });

  describe('error handling', () => {
    it('extracts error information', async () => {
      const { logger } = await import('./logger.js');
      const channel = Platform.createBroadcastChannel('logger');
      ready(channel);
      const error = new Error('error');
      logger.debug({ source: 'job', message: 'test', error });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'job',
          message: 'test',
          error: {
            name: 'Error',
            message: 'error',
            stack: expectAnyString
          }
        })
      );
    });

    it('extracts cause', async () => {
      const { logger } = await import('./logger.js');
      const channel = Platform.createBroadcastChannel('logger');
      ready(channel);
      const error = new Error('error');
      error.cause = new Error('cause');
      logger.debug({ source: 'job', message: 'test', error });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'job',
          message: 'test',
          error: {
            name: 'Error',
            message: 'error',
            stack: expectAnyString,
            cause: {
              name: 'Error',
              message: 'cause',
              stack: expectAnyString
            }
          }
        })
      );
    });

    it('supports AggregateError', async () => {
      const { logger } = await import('./logger.js');
      const channel = Platform.createBroadcastChannel('logger');
      ready(channel);
      const error = new AggregateError([new Error('error1'), new Error('error2')], 'aggregate error');
      logger.debug({ source: 'job', message: 'test', error });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'job',
          message: 'test',
          error: {
            name: 'AggregateError',
            message: 'aggregate error',
            stack: expectAnyString,
            errors: [
              {
                name: 'Error',
                message: 'error1',
                stack: expectAnyString
              },
              {
                name: 'Error',
                message: 'error2',
                stack: expectAnyString
              }
            ]
          }
        })
      );
    });

    it('extrapolates error information', async () => {
      const { logger } = await import('./logger.js');
      const channel = Platform.createBroadcastChannel('logger');
      ready(channel);
      logger.debug({ source: 'job', message: 'test', error: 'string' });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'job',
          message: 'test',
          error: {
            name: 'Error',
            message: '"string"',
            stack: expectAnyString
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
      ready(channel);
      logger[level]({ source: 'job', message: 'test' });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel[level]
        })
      );
    });
  }

  it('closes the broadcast channel when the terminate signal is received', async () => {
    await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    postMessage(channel, { command: 'terminate' });
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
      data: {
        system: expectAnyNumber,
        user: expectAnyNumber
      }
    });
    expect(logger.debug).toHaveBeenCalledWith({
      source: 'metric',
      message: 'memoryUsage',
      data: {
        arrayBuffers: expectAnyNumber,
        external: expectAnyNumber,
        heapTotal: expectAnyNumber,
        heapUsed: expectAnyNumber,
        rss: expectAnyNumber
      }
    });
  });

  it('stops monitoring thread metrics the terminate signal is received', async () => {
    const { logger } = await import('./logger.js');
    vi.spyOn(logger, 'debug');
    const channel = Platform.createBroadcastChannel('logger');
    postMessage(channel, { command: 'terminate' });
    vi.advanceTimersToNextTimer();
    expect(logger.debug).not.toHaveBeenCalled();
  });
});

const cwd = '~/test';

describe('start', () => {
  it('fails if not on the main thread', async () => {
    Object.assign(Platform, { isMainThread: false });
    const { logger } = await import('./logger.js');
    expect(() => logger.start({ cwd } as Configuration)).toThrowError(AssertionError);
    expect(Platform.createWorker).not.toHaveBeenCalled();
    expect(Platform.onTerminalResize).not.toHaveBeenCalled();
  });

  it('creates the logger workers', async () => {
    Object.assign(Platform, { isMainThread: true });
    const { logger } = await import('./logger.js');
    logger.start({ cwd } as Configuration);
    expect(Platform.createWorker).toHaveBeenCalledWith('logger/allCompressed', { configuration: { cwd } });
    expect(Platform.createWorker).toHaveBeenCalledWith('logger/output', { configuration: { cwd } });
    expect(Platform.onTerminalResize).toHaveBeenCalled();
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

  const simulateWorkersExit = () => {
    const worker = Platform.createWorker('logger');
    (worker as unknown as EventTarget).dispatchEvent(new CustomEvent('exit'));
  };

  it('closes the logger worker', async () => {
    Object.assign(Platform, { isMainThread: true });
    const { logger } = await import('./logger.js');
    const channel = Platform.createBroadcastChannel('logger');
    logger.start({ cwd } as Configuration);
    const closing = logger.stop();
    simulateWorkersExit();
    await closing;
    expect(channel.postMessage).toHaveBeenCalledWith({ command: 'terminate' });
  });

  it('supports multiple closing', async () => {
    Object.assign(Platform, { isMainThread: true });
    const { logger } = await import('./logger.js');
    logger.start({ cwd } as Configuration);
    const firstClose = logger.stop();
    const secondClose = logger.stop();
    simulateWorkersExit();
    await expect(Promise.all([firstClose, secondClose])).resolves.toStrictEqual([undefined, undefined]);
  });
});
