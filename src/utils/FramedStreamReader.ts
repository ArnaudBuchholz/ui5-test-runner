import assert from 'node:assert';
import { Exit, FileSystem } from '../platform/index.js';
import { setTimeout } from 'node:timers/promises';

export interface IFramedStreamReader {
  read(): AsyncIterableIterator<Buffer>;
}

export class FramedStreamReader {
  static create(fileName: string, pollIntervalMs = 500): IFramedStreamReader {
    return new this(fileName, pollIntervalMs);
  }

  protected _fileName: string;
  protected _pollIntervalMs: number;

  protected constructor(fileName: string, pollIntervalMs: number) {
    this._fileName = fileName;
    this._pollIntervalMs = pollIntervalMs;
  }

  async *read(): AsyncIterableIterator<Buffer> {
    let startPos = 0;
    let reading = true;
    let buffer = Buffer.alloc(0);

    const task = Exit.registerAsyncTask({
      name: `FramedStreamReader(${this._fileName})`,
      stop: () => {
        reading = false;
      }
    });

    while (reading) {
      const stats = await FileSystem.stat(this._fileName);
      if (stats.size > startPos) {
        const fileStream = FileSystem.createReadStream(this._fileName, {
          start: startPos,
          end: stats.size - 1,
          highWaterMark: 64 * 1024
        });
        for await (const chunk of fileStream) {
          assert.ok(chunk instanceof Buffer);
          buffer = Buffer.concat([buffer, chunk]);
          startPos += chunk.length;
          while (buffer.length >= 4) {
            const size = buffer.readUInt32BE();
            if (size === 0) {
              task.unregister();
              return;
            }
            if (buffer.length < size + 4) {
              break;
            }
            yield buffer.subarray(4, size + 4);
            buffer = Buffer.from(buffer.subarray(size + 4));
          }
        }
      }
      await setTimeout(this._pollIntervalMs);
    }
  }
}
