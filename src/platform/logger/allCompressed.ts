import { Path, Thread, ZLib } from '../index.js';
import type { InternalLogAttributes, LogAttributes, LogMessage } from './types.js';
import { LogLevel } from './types.js';
import { toInternalLogAttributes } from './toInternalLogAttributes.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { createCompressionContext, compress } from './compress.js';
import { FramedStreamWriter } from '../../utils/node/FramedStreamWriter.js';

export const MAX_BUFFER_COUNT = 50;
const FLUSH_INTERVAL_MS = 200;
const compressionContext = createCompressionContext();

export const workerMain = ({ configuration }: { configuration: Configuration }) => {
  const LOG_FILE_NAME = `app-${new Date().toISOString().slice(0, 19).replaceAll(/[-:]/g, '').replace('T', '-')}.log.gz`;
  const stream = FramedStreamWriter.create(Path.join(configuration.reportDir, LOG_FILE_NAME));
  const buffer: string[] = [];
  let flushTimeout: ReturnType<typeof setTimeout> | undefined;
  let writePromise = Promise.resolve();

  const flushBuffer = () => {
    if (buffer.length === 0) {
      return;
    }
    const chunk = buffer.join('\n');
    buffer.length = 0;
    clearTimeout(flushTimeout);
    flushTimeout = undefined;
    const compressed = ZLib.deflateRawSync(chunk, { level: ZLib.constants.Z_BEST_COMPRESSION });
    writePromise = writePromise.then(() => stream.write(compressed));
  };

  const log = (attributes: InternalLogAttributes) => {
    buffer.push(compress(compressionContext, attributes));
    if (buffer.length >= MAX_BUFFER_COUNT) {
      flushBuffer();
    } else if (!flushTimeout) {
      flushTimeout = setTimeout(flushBuffer, FLUSH_INTERVAL_MS);
    }
  };

  const _log = (attributes: LogAttributes) => log(toInternalLogAttributes(attributes, LogLevel.info));

  const channel = Thread.createBroadcastChannel('logger');
  channel.onmessage = (event: { data: LogMessage }) => {
    const { data: message } = event;
    if (message.command === 'terminate') {
      _log({ source: 'logger', message: 'Logger terminating' });
      channel.close();
      flushBuffer();
      void writePromise.then(() => stream.end());
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
