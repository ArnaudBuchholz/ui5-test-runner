import { Platform } from '../Platform.js';
import type { InternalLogAttributes, LogAttributes, LogMessage } from './types.js';
import { LogLevel, toInternalLogAttributes } from './types.js';
import type { Configuration } from '../configuration/Configuration.js';
import '../logger.js';

export const MAX_BUFFER_SIZE = 50;
const FLUSH_INTERVAL_MS = 200;
const reduceNumber = (value: number) => Number(value).toString(36);

export const workerMain = ({ configuration }: { configuration: Configuration }) => {
  const LOG_FILE_NAME = `app-${new Date().toISOString().slice(0, 19).replaceAll(/[-:]/g, '').replace('T', '-')}.log`;

  const { cwd } = configuration;

  const fileStream = Platform.createWriteStream(Platform.join(cwd, LOG_FILE_NAME + '.gz'));
  const gzipStream = Platform.createGzip({ flush: Platform.Z_FULL_FLUSH });
  gzipStream.pipe(fileStream);
  const gzBuffer: (string | [string, object])[] = [];
  let gzFlushTimeout: ReturnType<typeof setTimeout> | undefined;

  const gzFlushBuffer = () => {
    const dataToWrite = gzBuffer.map((log) => JSON.stringify(log)).join('\n') + '\n';
    gzipStream.write(dataToWrite);

    gzBuffer.length = 0;
    clearTimeout(gzFlushTimeout);
    gzFlushTimeout = undefined;
  };

  const log = (attributes: InternalLogAttributes) => {
    const { level, timestamp, processId, threadId, isMainThread, source, message, data } = attributes;
    const compressed = `${level.toString()}${reduceNumber(timestamp)}:${reduceNumber(processId)}:${reduceNumber(threadId)}${isMainThread ? '!' : ''}:${source}:${message}`;
    gzBuffer.push(data ? [compressed, data] : compressed);
    if (gzBuffer.length >= MAX_BUFFER_SIZE) {
      gzFlushBuffer();
    } else if (!gzFlushTimeout) {
      gzFlushTimeout = setTimeout(gzFlushBuffer, FLUSH_INTERVAL_MS);
    }
  };

  const _log = (attributes: LogAttributes) => log(toInternalLogAttributes(attributes, LogLevel.info));

  const channel = Platform.createBroadcastChannel('logger');
  channel.onmessage = (event: { data: LogMessage }) => {
    const { data: message } = event;
    if (message.command === 'terminate') {
      _log({ source: 'logger', message: 'Logger terminating' });
      channel.close();
      gzFlushBuffer();
      gzipStream.end();
    } else if (message.command === 'log') {
      log(message);
    }
  };

  _log({ source: 'logger', message: 'Logger ready' });
  channel.postMessage({
    command: 'ready',
    source: 'allCompressed'
  } satisfies LogMessage);
};
