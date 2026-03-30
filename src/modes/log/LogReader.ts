import { ZLib } from '../../platform/index.js';
import { createCompressionContext, uncompress } from '../../platform/logger/compress.js';
import type { InternalLogAttributes } from '../../platform/logger/types.js';
import { FramedStreamReader } from '../../utils/FramedStreamReader.js';
import type { LogMetrics } from './LogMetrics.js';
import { getInitialLogMetrics } from './LogMetrics.js';

export const POLL_INTERVAL_MS = 500;

export type LogReaderItem =
  | ({
      type: 'log';
    } & InternalLogAttributes)
  | ({
      type: 'metrics';
    } & LogMetrics);

export const LogReader = {
  async *read(logFileName: string, signal?: AbortSignal): AsyncIterableIterator<LogReaderItem> {
    const context = createCompressionContext();
    const stream = FramedStreamReader.create(logFileName, POLL_INTERVAL_MS);
    const metrics = getInitialLogMetrics();
    for await (const chunk of stream.read(signal)) {
      metrics.inputSize += 4 + chunk.length;
      ++metrics.chunksCount;
      const lines = ZLib.inflateRawSync(chunk).toString();
      const jsons = uncompress(context, lines);
      for (const json of jsons) {
        ++metrics.logCount;
        metrics.minTimestamp = Math.min(metrics.minTimestamp, json.timestamp);
        metrics.maxTimestamp = Math.max(metrics.maxTimestamp, json.timestamp);
        metrics.outputSize += JSON.stringify(json).length + 1;
        yield {
          type: 'log',
          ...json
        };
      }
      yield {
        type: 'metrics',
        ...metrics
      };
    }
    metrics.reading = false;
    yield {
      type: 'metrics',
      ...metrics
    };
  }
};
