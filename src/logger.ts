import { Platform } from './Platform.js';
import assert from 'node:assert/strict'; // can't use ./logger.js because of dependency loop

type ErrorAttributes = {
  name: string;
  message: string;
  stack?: string;
  cause?: ErrorAttributes;
  errors?: ErrorAttributes[];
};

export type LogAttributes = {
  source: string;
  message: string;
  error?: unknown;
  data?: object;
};

export const LogLevel = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal'
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export type InternalLogAttributes = {
  /** Time stamp (UNIX epoch) */
  timestamp: number;
  /** level */
  level: LogLevel;
  /** process id */
  processId: number;
  /** thread id */
  threadId: number;
  /** indicates if this is the main thread */
  isMainThread: boolean;
};

const channel = Platform.createBroadcastChannel('logger');
let worker: ReturnType<typeof Platform.createWorker> | undefined;
const buffer: (InternalLogAttributes & LogAttributes)[] = [];
let ready = false;

const metricsMonitorInterval = setInterval(() => {
  logger.debug({ source: 'metric', message: 'threadCpuUsage', data: Platform.threadCpuUsage() });
  logger.debug({ source: 'metric', message: 'memoryUsage', data: Platform.memoryUsage() });
}, 1000);

channel.onmessage = (event: { data: object }) => {
  if ('ready' in event.data) {
    ready = true;
    if (buffer.length > 0) {
      for (const buffered of buffer) {
        channel.postMessage(buffered);
      }
      buffer.length = 0;
    }
  } else if ('terminate' in event.data) {
    clearInterval(metricsMonitorInterval);
    channel.close();
  }
};

const convertErrorToAttributes = (error: unknown): ErrorAttributes => {
  if (!(error instanceof Error)) {
    return convertErrorToAttributes(new Error(JSON.stringify(error)));
  }
  const attributes: ErrorAttributes = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
  if (error.cause) {
    attributes.cause = convertErrorToAttributes(error.cause);
  }
  if (error instanceof AggregateError) {
    attributes.errors = error.errors.map((item) => convertErrorToAttributes(item));
  }
  return attributes;
};

const log = (level: LogLevel, attributes: LogAttributes) => {
  const allAttributes: InternalLogAttributes & LogAttributes = {
    timestamp: Date.now(),
    level,
    processId: Platform.pid,
    threadId: Platform.threadId,
    isMainThread: Platform.isMainThread,
    ...attributes
  };
  if (attributes.error) {
    allAttributes.error = convertErrorToAttributes(attributes.error);
  }
  if (ready) {
    channel.postMessage(allAttributes);
  } else {
    // Not aware if the logger is ready, buffering and asking
    buffer.push(allAttributes);
    channel.postMessage({ isReady: true });
  }
};

export const logger = {
  open(cwd: string) {
    assert.ok(Platform.isMainThread, 'Call logger.open only in main thread');
    worker = Platform.createWorker('logger', { cwd });
  },

  debug(attributes: LogAttributes) {
    log('debug', attributes);
  },
  info(attributes: LogAttributes) {
    log('info', attributes);
  },
  warn(attributes: LogAttributes) {
    log('warn', attributes);
  },
  error(attributes: LogAttributes) {
    log('error', attributes);
  },
  fatal(attributes: LogAttributes) {
    log('fatal', attributes);
  },

  async close() {
    assert.ok(Platform.isMainThread, 'Call logger.close only in main thread');
    assert.ok(worker, 'Call logger.close only after opening');
    const { promise, resolve } = Promise.withResolvers();
    worker.on('exit', resolve);
    channel.postMessage({ terminate: true });
    await promise;
  }
};
