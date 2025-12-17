import { Platform } from '../Platform.js';
import type { InternalLogAttributes, LogAttributes, LogMessage } from './types.js';
import { LogLevel, toInternalLogAttributes } from './types.js';
import type { Configuration } from '../configuration/Configuration.js';
import '../logger.js';
import { createCompressionContext, compress } from './compress.js';

export const MAX_BUFFER_COUNT = 50;
const FLUSH_INTERVAL_MS = 200;
const compressionContext = createCompressionContext();

export const workerMain = ({ configuration }: { configuration: Configuration }) => {
  const LOG_FILE_NAME = `app-${new Date().toISOString().slice(0, 19).replaceAll(/[-:]/g, '').replace('T', '-')}.log`;

  const { cwd } = configuration;

  const fileStream = Platform.createWriteStream(Platform.join(cwd, LOG_FILE_NAME + '.gz'));
  const gzipStream = Platform.createGzip({ flush: Platform.Z_FULL_FLUSH });
  gzipStream.pipe(fileStream);
  const gzBuffer: string[] = [];
  let gzFlushTimeout: ReturnType<typeof setTimeout> | undefined;

  const gzFlushBuffer = () => {
    for (const chunk of gzBuffer) {
      gzipStream.write(chunk);
    }
    gzBuffer.length = 0;
    clearTimeout(gzFlushTimeout);
    gzFlushTimeout = undefined;
  };

  const log = (attributes: InternalLogAttributes) => {
    gzBuffer.push(compress(compressionContext, attributes));
    if (gzBuffer.length >= MAX_BUFFER_COUNT) {
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
