import { Platform } from './Platform.js';

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
  fatal: 'fatal',
} as const
export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

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
if (Platform.isMainThread) {
  worker = Platform.createWorker('logger');
}
const buffer: (InternalLogAttributes & LogAttributes)[] = [];
let ready = false;

const metricsMonitorInterval = setInterval(() => {
  logger.debug({ source: 'metric', message: 'threadCpuUsage', data: Platform.threadCpuUsage() });
  logger.debug({ source: 'metric', message: 'memoryUsage', data: Platform.memoryUsage() });
}, 1000)

channel.onmessage = (event: any) => {
  if (event.data.ready) {
    ready = true;
    if (buffer.length) {
      for (const buffered of buffer) {
        channel.postMessage(buffered);
      }
      buffer.length = 0;
    }
  } else if (event.data.terminate) {
    channel.close();
  }
};

const log = (level: LogLevel, attributes: LogAttributes) => {
  const allAttributes = {
    timestamp: Date.now(),
    level,
    processId: process.pid,
    threadId: Platform.threadId,
    isMainThread: Platform.isMainThread,
    ...attributes
  } satisfies InternalLogAttributes & LogAttributes;
  if (ready) {
    channel.postMessage(allAttributes);
  } else {
    // Not aware if the logger is ready, buffering and asking
    buffer.push(allAttributes);
    channel.postMessage({ isReady: true });
  }
}

export const logger = {
  debug(attributes: LogAttributes) { log('debug', attributes); },
  info(attributes: LogAttributes) { log('info', attributes); },
  warn(attributes: LogAttributes) { log('warn', attributes); },
  error(attributes: LogAttributes) { log('error', attributes); },
  fatal(attributes: LogAttributes) { log('fatal', attributes); },

  async close() {
    clearInterval(metricsMonitorInterval);
    if (worker) {
      const { promise, resolve } = Promise.withResolvers();
      worker.on('exit', resolve);
      channel.postMessage({ terminate: true });
      await promise;
    }
    channel.close();
  }
};
