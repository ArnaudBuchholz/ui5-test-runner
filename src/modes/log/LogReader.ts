import { ZLib } from '../../platform/index.js';
import { createCompressionContext, uncompress } from '../../platform/logger/compress.js';
import type { InternalLogAttributes } from '../../platform/logger/types.js';
import { FramedStreamReader } from '../../utils/FramedStreamReader.js';
import type { LogMetrics } from './LogMetrics.js';

export const POLL_INTERVAL_MS = 500;

export type LogReaderItem =
  | ({
      type: 'log';
    } & InternalLogAttributes)
  | ({
      type: 'metrics';
    } & LogMetrics);

export const LogReader = {
  async *read(logFileName: string): AsyncIterableIterator<LogReaderItem> {
    const context = createCompressionContext();
    const stream = FramedStreamReader.create(logFileName, POLL_INTERVAL_MS);
    let inputSize = 0;
    let outputSize = 0;
    let chunksCount = 0;
    for await (const chunk of stream.read()) {
      inputSize += 4 + chunk.length;
      ++chunksCount;
      const lines = ZLib.inflateRawSync(chunk).toString();
      const jsons = uncompress(context, lines);
      for (const json of jsons) {
        outputSize += JSON.stringify(json).length + 1;
        yield {
          type: 'log',
          ...json
        };
      }
      yield {
        type: 'metrics',
        inputSize,
        chunksCount,
        outputSize
      };
    }
  }
};
