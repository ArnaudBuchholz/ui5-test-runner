import { __developmentMode, Exit, FileSystem, Terminal, ZLib } from '../platform/index.js';
import type { IRegisteredAsyncTask } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import { uncompress, createCompressionContext } from '../platform/logger/compress.js';

const POLL_INTERVAL_MS = 500;

export const log = async (configuration: Configuration) => {
  const logFileName = configuration.log!; // Validated by configuration

  const context = createCompressionContext();
  let gunzip: ReturnType<typeof ZLib.createGunzip>;
  let sourcePos = 0;
  let outputSize = 0;
  let chunksCount = 0;
  let pending = '';
  let readTimeoutId: ReturnType<typeof setTimeout> | undefined;

  const report = () => {
    if (__developmentMode) {
      const compressionRatio = Math.floor((10_000 * sourcePos) / outputSize) / 100;
      console.error(
        `${Terminal.BLUE}[~]${Terminal.WHITE}From @${sourcePos} to ${outputSize} (${chunksCount} chunks), ratio: ${compressionRatio}%`
      );
    }
  };

  const data = (chunk: Buffer) => {
    ++chunksCount;
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

  const error = () => {
    if (__developmentMode) {
      console.error(`${Terminal.RED}(X)${Terminal.WHITE}GUNZIP error, recreating...`);
    }
    const newGunzip = ZLib.createGunzip();
    newGunzip.on('data', data);
    newGunzip.on('error', error);
    gunzip = newGunzip;
  };

  async function tailOnce() {
    if (__developmentMode) {
      console.error(`${Terminal.BLUE}[~]${Terminal.WHITE}Reading from @${sourcePos}`);
    }
    const stats = await FileSystem.stat(logFileName);
    if (stats.size > sourcePos) {
      const end = stats.size - 1;
      const fileStream = FileSystem.createReadStream(logFileName, { start: sourcePos, end, highWaterMark: 64 * 1024 });
      gunzip = ZLib.createGunzip();
      gunzip.on('data', data);
      gunzip.on('error', error);
      fileStream.pipe(gunzip, { end: false });
      fileStream.on('end', () => {
        sourcePos = end + 1;
        report();
        readTimeoutId = setTimeout(() => void tailOnce(), POLL_INTERVAL_MS);
      });
      fileStream.on('error', (reason) => {
        console.error(reason);
        stop();
      });
    }
  }

  const { promise, resolve } = Promise.withResolvers<void>();

  let task: IRegisteredAsyncTask | undefined;

  const stop = () => {
    if (readTimeoutId !== undefined) {
      clearTimeout(readTimeoutId);
    }
    gunzip?.end();
    report();
    task?.unregister();
    resolve();
  };

  task = Exit.registerAsyncTask({
    name: 'log',
    stop: stop
  });

  void tailOnce();
  return promise;
};
