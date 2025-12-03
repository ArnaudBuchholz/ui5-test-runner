import type { Configuration } from './configuration/Configuration.js';
import type {
  LogErrorAttributes,
  InternalLogAttributes,
  LogAttributes,
  LogMessage,
  ReadySource
} from './logger/types.js';
import { LogLevel, toInternalLogAttributes } from './logger/types.js';
import { Platform } from './Platform.js';
import assert from 'node:assert/strict';

// TODO understand why channel does not appear as a problem as it might be used before being defined
let channel: ReturnType<typeof Platform.createBroadcastChannel>;
let loggerWorker: ReturnType<typeof Platform.createWorker> | undefined;
let consoleWorker: ReturnType<typeof Platform.createWorker> | undefined;
const buffer: InternalLogAttributes[] = [];
const waitingFor: ReadySource[] = ['allCompressed', 'output'];
let ready = false;

let metricsMonitorInterval: ReturnType<typeof setInterval>;

const start = () => {
  channel = Platform.createBroadcastChannel('logger');

  metricsMonitorInterval = setInterval(() => {
    logger.debug({ source: 'metric', message: 'threadCpuUsage', data: Platform.threadCpuUsage() });
    logger.debug({ source: 'metric', message: 'memoryUsage', data: Platform.memoryUsage() });
  }, 1000);

  channel.onmessage = (event: { data: LogMessage }) => {
    const { data: message } = event;
    if (message.command === 'ready') {
      const index = waitingFor.indexOf(message.source);
      waitingFor.splice(index, 1); // Only two ready messages will be sent
      ready = waitingFor.length === 0;
      if (ready && buffer.length > 0) {
        for (const buffered of buffer) {
          channel.postMessage({
            command: 'log',
            ...buffered
          } satisfies LogMessage);
        }
        buffer.length = 0;
      }
    } else if (message.command === 'terminate') {
      clearInterval(metricsMonitorInterval);
      channel.close();
    }
  };
};

const convertErrorToAttributes = (error: unknown): LogErrorAttributes => {
  if (!(error instanceof Error)) {
    return convertErrorToAttributes(new Error(JSON.stringify(error)));
  }
  const attributes: LogErrorAttributes = {
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
  const allAttributes = toInternalLogAttributes(attributes, level);
  if (attributes.error) {
    allAttributes.error = convertErrorToAttributes(attributes.error);
  }
  if (ready) {
    channel.postMessage({
      command: 'log',
      ...allAttributes
    } satisfies LogMessage);
  } else {
    // Not all workers are ready, buffering and asking
    buffer.push(allAttributes);
  }
};

if (!Platform.isMainThread) {
  start();
}

export const logger = {
  start(configuration: Configuration) {
    assert.ok(Platform.isMainThread, 'Call logger.start only in main thread');
    start();
    loggerWorker = Platform.createWorker('logger/allCompressed', { configuration });
    consoleWorker = Platform.createWorker('logger/output', { configuration });
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
  error(attributes: LogAttributes) {
    log(LogLevel.error, attributes);
  },
  fatal(attributes: LogAttributes) {
    log(LogLevel.fatal, attributes);
  },

  async stop() {
    assert.ok(Platform.isMainThread, 'Call logger.stop only in main thread');
    assert.ok(loggerWorker && consoleWorker, 'Call logger.stop only after starting');
    clearInterval(metricsMonitorInterval);
    const { promise: loggerPromise, resolve: loggerExited } = Promise.withResolvers();
    const { promise: consolePromise, resolve: consoleExited } = Promise.withResolvers();
    loggerWorker.on('exit', loggerExited);
    consoleWorker.on('exit', consoleExited);
    channel.postMessage({ command: 'terminate' } satisfies LogMessage);
    await Promise.all([loggerPromise, consolePromise]);
    channel.close();
  }
};
