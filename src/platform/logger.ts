import { Exit, ExitShutdownError } from './Exit.js';
import { Host } from './Host.js';
import { Terminal } from './Terminal.js';
import { Thread } from './Thread.js';
import { performance } from 'node:perf_hooks';
import type { Configuration } from '../configuration/Configuration.js';
import type { InternalLogAttributes, LogAttributes, LogMessage, ReadySource } from './logger/types.js';
import type { ILoggerService } from './logger/ILogger.ts';
import { LogLevel } from './logger/types.js';
import { toInternalLogAttributes } from './logger/toInternalLogAttributes.js';
import assert from 'node:assert/strict';
import { toPlainObject } from '../utils/shared/object.js';
import { toIError } from '../utils/shared/toIError.js';

const startedAt = Date.now();

// TODO understand why channel does not appear as a problem as it might be used before being defined
let channel: ReturnType<typeof Thread.createBroadcastChannel>;
let loggerWorker: ReturnType<typeof Thread.createWorker> | undefined;
let consoleWorker: ReturnType<typeof Thread.createWorker> | undefined;
const buffer: InternalLogAttributes[] = [];
const waitingFor: ReadySource[] = ['allCompressed', 'output'];
let isReady = !Thread.isMainThread;
const { promise: startPromise, resolve: startResolve } = Promise.withResolvers<void>();

let metricsMonitorInterval: ReturnType<typeof setInterval>;
let lastELU = performance.eventLoopUtilization();

// Only the main thread can access terminal as TTY
const terminalResized = (width: number) => {
  channel?.postMessage({
    command: 'terminal-resized',
    width
  } satisfies LogMessage);
};

const start = () => {
  channel = Thread.createBroadcastChannel('logger');

  metricsMonitorInterval = setInterval(() => {
    const cpu = Thread.threadCpuUsage();
    const mem = Host.memoryUsage();
    const temporaryELU = performance.eventLoopUtilization();
    const elu = performance.eventLoopUtilization(temporaryELU, lastELU);
    lastELU = temporaryELU;
    const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
    const cpuUserMs = Math.round(cpu.user / 1000);
    logger.debug({
      source: 'metric',
      message: `heapUsed=${heapUsedMB}MB cpu=${cpuUserMs}ms elu=${elu.utilization.toFixed(3)}`,
      data: { cpu, mem, elu }
    });
  }, 1000);

  channel.onmessage = (event: { data: LogMessage }) => {
    const { data: message } = event;
    if (message.command === 'ready' && Thread.isMainThread) {
      terminalResized(Terminal.width);
      const index = waitingFor.indexOf(message.source);
      waitingFor.splice(index, 1); // Only two ready messages will be sent
      isReady = waitingFor.length === 0;
      if (isReady) {
        if (buffer.length > 0) {
          for (const buffered of buffer) {
            channel.postMessage({
              command: 'log',
              ...buffered
            } satisfies LogMessage);
          }
          buffer.length = 0;
        }
        startResolve();
      }
    } else if (message.command === 'terminate') {
      clearInterval(metricsMonitorInterval);
      channel.close();
    }
  };
};

const log = (level: LogLevel, attributes: LogAttributes) => {
  const allAttributes = toInternalLogAttributes(attributes, level);
  if (attributes.error) {
    allAttributes.error = toIError(attributes.error);
  }
  if (isReady && !stopping) {
    channel.postMessage({
      command: 'log',
      ...allAttributes
    } satisfies LogMessage);
  } else {
    // Not all workers are ready, buffering and asking
    buffer.push(allAttributes);
  }
};

if (!Thread.isMainThread) {
  start();
}

let stopping: Promise<void> | undefined;

export const logger = {
  async start(configuration: Configuration): Promise<void> {
    assert.ok(Thread.isMainThread, 'Call logger.start only in main thread');
    assert.ok(!loggerWorker && !consoleWorker, 'Call logger.start only once');
    start();
    loggerWorker = Thread.createWorker('platform/logger/allCompressed', {
      configuration: toPlainObject(configuration)
    });
    consoleWorker = Thread.createWorker('platform/logger/output', {
      configuration: toPlainObject(configuration),
      startedAt
    });
    if (!configuration.ci) {
      Terminal.setRawMode((data) => {
        if (!(data.length === 1 && data[0] === 3)) {
          return;
        }

        logger.warn({ source: 'job', message: 'User requested interruption' });
        Exit.sigInt();
      });
      Terminal.onResize(terminalResized);
    }
    return startPromise;
  },

  debug(attributes: LogAttributes) {
    log(LogLevel.debug, attributes);
  },
  info(attributes: LogAttributes) {
    log(LogLevel.info, attributes);
  },
  warn(attributes: LogAttributes) {
    log(LogLevel.warn, attributes);
  },
  /** automatic switch to debug if error instanceof ExitShutdownError */
  error(attributes: LogAttributes) {
    log(
      attributes.error && attributes.error instanceof ExitShutdownError ? LogLevel.debug : LogLevel.error,
      attributes
    );
  },
  fatal(attributes: LogAttributes) {
    log(LogLevel.fatal, attributes);
  },

  async stop() {
    assert.ok(Thread.isMainThread, 'Call logger.stop only in main thread');
    if (stopping) {
      return await stopping;
    }
    const { promise, resolve } = Promise.withResolvers<void>();
    stopping = promise;
    clearInterval(metricsMonitorInterval);
    if (loggerWorker && consoleWorker) {
      while (waitingFor.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      const { promise: loggerPromise, resolve: loggerExited } = Promise.withResolvers();
      const { promise: consolePromise, resolve: consoleExited } = Promise.withResolvers();
      loggerWorker.on('exit', loggerExited);
      consoleWorker.on('exit', consoleExited);
      channel.postMessage({ command: 'terminate' } satisfies LogMessage);
      await Promise.all([loggerPromise, consolePromise]);
      channel.close();
    }
    Terminal.setRawMode(false);
    resolve();
  }
} as const satisfies ILoggerService;
