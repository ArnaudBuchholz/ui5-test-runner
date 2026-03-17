import { setTimeout } from 'node:timers/promises';
import { FileSystem, ZLib } from '../../platform/index.js';
import { createCompressionContext, uncompress } from '../../platform/logger/compress.js';
import type { InternalLogAttributes } from '../../platform/logger/types';

const POLL_INTERVAL_MS = 500;

type LogReaderItem =
  | ({
      type: 'log';
    } & InternalLogAttributes)
  | {
      type: 'status';
      sourcePos: number;
      chunksCount: number;
      outputSize: number;
    };

export const LogReader = {
  async *read(logFileName: string): AsyncIterableIterator<LogReaderItem> {
    const context = createCompressionContext();
    let gunzip: ReturnType<typeof ZLib.createGunzip>;
    const sourcePos = 0;
    let outputSize = 0;
    let chunksCount = 0;
    let pending = '';
    let reading = true;

    while (reading) {
      const stats = await FileSystem.stat(logFileName);
      if (stats.size > sourcePos) {
        const endPos = stats.size - 1;
        const fileStream = FileSystem.createReadStream(logFileName, {
          start: sourcePos,
          end: endPos,
          highWaterMark: 64 * 1024
        });
        gunzip = ZLib.createGunzip();
        try {
          for await (const chunk of fileStream.pipe(gunzip, { end: false })) {
            ++chunksCount;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Buffer chunks
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
                yield {
                  type: 'log',
                  ...json
                };
                if (json.source === 'logger' && json.message === 'Logger terminating') {
                  reading = false;
                }
              }
            }
          }
        } catch (error) {
          // TODO: not sure how to handle it
          console.error(error);
        }
      }
      yield {
        type: 'status',
        sourcePos,
        chunksCount,
        outputSize
      };
      await setTimeout(POLL_INTERVAL_MS);
    }
  }
};
