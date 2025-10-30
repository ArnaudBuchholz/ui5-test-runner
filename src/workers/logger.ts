import { Platform } from '../Platform.js';
import { assert } from '../assert.js';
import type { InternalLogAttributes, LogAttributes } from '../logger.js';

const LOG_FILE_NAME = `app-${new Date().toISOString().slice(0, 19).replaceAll(/[-:]/g, '').replace('T', '-')}.log`;

const assertIfValidWorkerData: (value: object) => asserts value is { cwd: string } = (value) => {
  assert('cwd' in value);
  assert(typeof value.cwd === 'string');
};
assertIfValidWorkerData(Platform.workerData);

const { cwd } = Platform.workerData;
const fileStream = Platform.createWriteStream(Platform.join(cwd, LOG_FILE_NAME + '.gz'));
const gzipStream = Platform.createGzip({ flush: Platform.Z_FULL_FLUSH });
gzipStream.pipe(fileStream);
const gzBuffer: (string | [string, object])[] = [];
let gzFlushTimeout: ReturnType<typeof setTimeout> | undefined;
const GZ_MAX_BUFFER_SIZE = 50;
const GZ_FLUSH_INTERVAL_MS = 200;

const gzFlushBuffer = () => {
  if (gzBuffer.length === 0) {
    return;
  }

  const dataToWrite = gzBuffer.map((log) => JSON.stringify(log)).join('\n') + '\n';
  gzipStream.write(dataToWrite);

  gzBuffer.length = 0;
  clearTimeout(gzFlushTimeout);
  gzFlushTimeout = undefined;
};

const reduceNumber = (value: number) => Number(value).toString(36);

const log = (attributes: InternalLogAttributes & LogAttributes) => {
  const { level, timestamp, processId, threadId, isMainThread, source, message, data } = attributes;
  const compressed = `${level.charAt(0)}${reduceNumber(timestamp)}:${reduceNumber(processId)}:${reduceNumber(threadId)}${isMainThread ? '!' : ''}:${source}:${message}`;
  gzBuffer.push(data ? [compressed, data] : compressed);
  if (gzBuffer.length >= GZ_MAX_BUFFER_SIZE) {
    gzFlushBuffer();
  } else if (!gzFlushTimeout) {
    gzFlushTimeout = setTimeout(gzFlushBuffer, GZ_FLUSH_INTERVAL_MS);
  }
};

const _log = (attributes: LogAttributes) =>
  log({
    timestamp: Date.now(),
    level: 'info',
    processId: process.pid,
    threadId: Platform.threadId,
    isMainThread: Platform.isMainThread,
    ...attributes
  } satisfies InternalLogAttributes & LogAttributes);

const channel = new BroadcastChannel('logger');
channel.onmessage = (event: {
  data: { terminate: true } | { isReady: true } | (LogAttributes & InternalLogAttributes);
}) => {
  if ('terminate' in event.data) {
    _log({ source: 'logger', message: 'Logger terminating' });
    channel.close();
    gzFlushBuffer();
    gzipStream.end();
  } else if ('isReady' in event.data) {
    channel.postMessage({ ready: true });
  } else {
    log(event.data);
  }
};

_log({ source: 'logger', message: 'Logger ready' });
channel.postMessage({ ready: true });
