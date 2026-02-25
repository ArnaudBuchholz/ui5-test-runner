import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Host, Terminal, Thread } from './index.js';
import { AssertionError } from 'node:assert';
import type { Configuration } from '../configuration/Configuration.js';
import { LogLevel } from './logger/types.js';
import type { LogMessage } from './logger/types.js';
import type { logger as LoggerType } from './logger.js';
import { __lastTerminalRawModeCallback } from './mock.js';
import { Exit, ExitShutdownError } from './Exit.js';

const expectAnyString = expect.any(String) as string;
const expectAnyNumber = expect.any(Number) as number;
const cwd = '~/test';

// TODO: the main thread waits for the two outputs to be ready *before* sending the logs
// TODO: the other threads do not wait (because started from the main thread)

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.useFakeTimers();
});

describe('Main thread', () => {
  beforeEach(() => {
    Object.assign(Thread, { isMainThread: true });
  });

  const ready = (channel: ReturnType<typeof Thread.createBroadcastChannel>) => {
    channel.postMessage({ command: 'ready', source: 'allCompressed' } satisfies LogMessage);
    channel.postMessage({ command: 'ready', source: 'output' } satisfies LogMessage);
  };

  it('waits for start before opening a broadcast channel to communicate with the logger thread', async () => {
    await vi.importActual('./logger.js');
    expect(Thread.createBroadcastChannel).not.toHaveBeenCalled();
  });

  it('caches traces while waiting for the output threads to start', async () => {
    const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
    const channel = Thread.createBroadcastChannel('logger');
    logger.debug({ source: 'job', message: 'test' });
    expect(channel.postMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'job',
        message: 'test'
      })
    );
  });

  it('creates the logger workers when calling start', async () => {
    Object.assign(Thread, { isMainThread: true });
    const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
    logger.start({ cwd } as Configuration);
    expect(Thread.createWorker).toHaveBeenCalledWith('platform/logger/allCompressed', { configuration: { cwd } });
    expect(Thread.createWorker).toHaveBeenCalledWith('platform/logger/output', {
      configuration: { cwd },
      startedAt: expectAnyNumber
    });
    expect(Terminal.onResize).toHaveBeenCalled();
  });

  it('sends traces when the logger thread starts', async () => {
    const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
    logger.start({ cwd } as Configuration);
    const channel = Thread.createBroadcastChannel('logger');
    logger.debug({ source: 'job', message: 'test' });
    ready(channel);
    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'job',
        message: 'test'
      })
    );
  });

  describe('close', () => {
    it('does not fail if open has not been called', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      const channel = Thread.createBroadcastChannel('logger');
      await expect(logger.stop()).resolves.toBeUndefined();
      expect(channel.postMessage).not.toHaveBeenCalled();
    });

    const simulateWorkersExit = () => {
      const worker = Thread.createWorker('logger');
      (worker as unknown as EventTarget).dispatchEvent(new CustomEvent('exit'));
    };

    it('closes the logger worker', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      const channel = Thread.createBroadcastChannel('logger');
      logger.start({ cwd } as Configuration);
      ready(channel);
      const closing = logger.stop();
      simulateWorkersExit();
      await closing;
      expect(channel.postMessage).toHaveBeenCalledWith({ command: 'terminate' });
    });

    it('closing must wait for the sub workers to be started first', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      const channel = Thread.createBroadcastChannel('logger');
      logger.start({ cwd } as Configuration);
      const closing = logger.stop();
      await vi.advanceTimersToNextTimerAsync();
      ready(channel);
      await vi.advanceTimersToNextTimerAsync();
      simulateWorkersExit();
      await closing;
      expect(channel.postMessage).toHaveBeenCalledWith({ command: 'terminate' });
    });

    it('supports multiple closing', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      const channel = Thread.createBroadcastChannel('logger');
      logger.start({ cwd } as Configuration);
      ready(channel);
      const firstClose = logger.stop();
      const secondClose = logger.stop();
      simulateWorkersExit();
      await expect(Promise.all([firstClose, secondClose])).resolves.toStrictEqual([undefined, undefined]);
    });
  });

  describe('raw mode', () => {
    it('uses raw mode (!ci)', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      logger.start({ cwd } as Configuration);
      expect(Terminal.setRawMode).toHaveBeenCalled();
    });

    it('detects CTRL+C and triggers Exit.sigInt', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      logger.start({ cwd } as Configuration);
      const buffer = Buffer.from([3]);
      expect.assert(typeof __lastTerminalRawModeCallback === 'function');
      __lastTerminalRawModeCallback(buffer);
      expect(Exit.sigInt).toHaveBeenCalled();
    });

    it('ignores other input', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      logger.start({ cwd } as Configuration);
      const buffer = Buffer.from([4]);
      expect.assert(typeof __lastTerminalRawModeCallback === 'function');
      __lastTerminalRawModeCallback(buffer);
      expect(Exit.sigInt).not.toHaveBeenCalled();
    });

    it('ignores other input (2)', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      logger.start({ cwd } as Configuration);
      const buffer = Buffer.from([3, 4]);
      expect.assert(typeof __lastTerminalRawModeCallback === 'function');
      __lastTerminalRawModeCallback(buffer);
      expect(Exit.sigInt).not.toHaveBeenCalled();
    });

    it('does not use raw mode (ci)', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      logger.start({ cwd, ci: true } as Configuration);
      expect(Terminal.setRawMode).not.toHaveBeenCalled();
    });
  });
});

describe('Worker thread', () => {
  beforeEach(() => {
    Object.assign(Thread, { isMainThread: false });
  });

  it('opens a broadcast channel to communicate with the logger thread', async () => {
    await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
    expect(Thread.createBroadcastChannel).toHaveBeenCalledWith('logger');
  });

  it('attaches a listener to the channel', async () => {
    await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
    const channel = Thread.createBroadcastChannel('logger');
    expect(channel.onmessage).not.toBeUndefined();
  });

  it('sends traces immediately', async () => {
    const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
    const channel = Thread.createBroadcastChannel('logger');
    logger.debug({ source: 'job', message: 'test' });
    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'job',
        message: 'test'
      })
    );
  });

  it('closes the broadcast channel when the terminate signal is received', async () => {
    await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
    const channel = Thread.createBroadcastChannel('logger');
    channel.postMessage({ command: 'terminate' } satisfies LogMessage);
    expect(channel.close).toHaveBeenCalled();
  });

  it('fails start if not on the main thread', async () => {
    Object.assign(Thread, { isMainThread: false });
    const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
    expect(() => logger.start({ cwd } as Configuration)).toThrowError(AssertionError);
    expect(Thread.createWorker).not.toHaveBeenCalled();
    expect(Terminal.onResize).not.toHaveBeenCalled();
  });

  it('fails close if not on the main thread', async () => {
    const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
    const channel = Thread.createBroadcastChannel('logger');
    await expect(() => logger.stop()).rejects.toThrowError(AssertionError);
    expect(channel.postMessage).not.toHaveBeenCalled();
  });
});

describe('general', () => {
  beforeEach(() => {
    Object.assign(Thread, { isMainThread: false });
  });

  it('documents traces with contextual information', async () => {
    const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
    const timestamp = Date.now(); // because of fake timers
    const channel = Thread.createBroadcastChannel('logger');
    logger.debug({ source: 'job', message: 'test' });
    expect(channel.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp,
        level: LogLevel.debug,
        processId: Host.pid,
        threadId: Thread.threadId,
        isMainThread: Thread.isMainThread,
        source: 'job',
        message: 'test'
      })
    );
  });

  describe('error handling', () => {
    it('extracts error information', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      const channel = Thread.createBroadcastChannel('logger');
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
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      const channel = Thread.createBroadcastChannel('logger');
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

    it('converts error trace to a debug one when the error is ExitShutdownError', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      const channel = Thread.createBroadcastChannel('logger');
      const error = new ExitShutdownError();
      logger.error({ source: 'job', message: 'test', error });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.debug,
          source: 'job',
          message: 'test',
          error: {
            name: 'ExitShutdownError',
            message: 'Exiting application',
            stack: expectAnyString
          }
        })
      );
    });

    it('supports AggregateError', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      const channel = Thread.createBroadcastChannel('logger');
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
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      const channel = Thread.createBroadcastChannel('logger');
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
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      const channel = Thread.createBroadcastChannel('logger');
      logger[level]({ source: 'job', message: 'test' });
      expect(channel.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel[level]
        })
      );
    });
  }

  describe('Metrics automatic monitoring', () => {
    it('monitors thread metrics automatically', async () => {
      const threadCpuUsage = {
        system: 1,
        user: 2
      };
      vi.mocked(Thread.threadCpuUsage).mockReturnValueOnce(threadCpuUsage);
      const memoryUsage = {
        arrayBuffers: 1,
        external: 2,
        heapTotal: 3,
        heapUsed: 4,
        rss: 5
      };
      vi.mocked(Host.memoryUsage).mockReturnValueOnce(memoryUsage);
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      vi.spyOn(logger, 'debug');
      vi.advanceTimersToNextTimer();
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'metric',
        message: '',
        data: {
          cpu: threadCpuUsage,
          mem: memoryUsage
        }
      });
    });

    it('stops monitoring thread metrics the terminate signal is received', async () => {
      const { logger } = await vi.importActual<{ logger: typeof LoggerType }>('./logger.js');
      vi.spyOn(logger, 'debug');
      const channel = Thread.createBroadcastChannel('logger');
      channel.postMessage({ command: 'terminate' } satisfies LogMessage);
      vi.advanceTimersToNextTimer();
      expect(logger.debug).not.toHaveBeenCalled();
    });
  });
});
