import { __developmentMode, Exit, FileSystem, ZLib } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import { uncompress, createCompressionContext } from '../platform/logger/compress.js';

export const log = async (configuration: Configuration) => {
  const logFileName = configuration.log!; // Validated by configuration

  const context = createCompressionContext();

  let gunzip: ReturnType<typeof ZLib.createGunzip>;
  let readPos = 0;
  let outputSize = 0;
  let pending = '';

  const data = (chunk: Buffer) => {
    pending += chunk.toString();
    const lines = pending.split('\n');
    pending = lines.pop() || '';

    for (const line of lines) {
      if (line.length === 0) {
        continue;
      }
      for (const json of uncompress(context, line)) {
        const stringified = JSON.stringify(json);
        outputSize += stringified.length + 1;
        console.log(stringified);
        if (json.source === 'logger' && json.message === 'Logger terminating') {
          stop();
        }
      }
    }
  };

  const error = (error_: unknown) => {
    console.log('ERROR', error_);
    const newGunzip = ZLib.createGunzip();
    newGunzip.on('data', data);
    newGunzip.on('error', error);
    gunzip = newGunzip;
  };

  async function tailOnce() {
    const stats = await FileSystem.stat(logFileName);
    if (stats.size > readPos) {
      const end = stats.size - 1;
      const fileStream = FileSystem.createReadStream(logFileName, { start: readPos, end, highWaterMark: 64 * 1024 });
      gunzip = ZLib.createGunzip();
      gunzip.on('data', data);
      gunzip.on('error', error);
      fileStream.pipe(gunzip, { end: false });
      await new Promise<void>((resolve, reject) => {
        fileStream.on('end', () => {
          readPos = end + 1;
          resolve();
        });
        fileStream.on('error', (e) => {
          reject(e);
        });
      });
    }
  }

  const pollIntervalMs = 500;
  const poller = setInterval(async () => {
    try {
      await tailOnce();
    } catch (error_) {
      console.error('tail error:', error_);
    }
  }, pollIntervalMs);

  const { promise, resolve } = Promise.withResolvers<void>();

  const stop = () => {
    clearInterval(poller);
    gunzip?.end();
    resolve();
  };

  Exit.registerAsyncTask({
    name: 'log',
    stop: stop
  });

  return promise;
};
