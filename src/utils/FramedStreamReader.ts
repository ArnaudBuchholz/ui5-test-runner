import type { IRegisteredAsyncTask } from '../platform/index.js';
import { Exit, FileSystem, assert } from '../platform/index.js';
import { setTimeout } from 'node:timers/promises';

export interface IFramedStreamReader {
  read(): AsyncIterableIterator<Buffer>;
}

type FrameExtractorItem =
  | {
      type: 'frame';
      frame: Buffer;
    }
  | {
      type: 'incomplete';
      remaining: Buffer;
    }
  | {
      type: 'end';
    };

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

  private *_extractFrames(buffer: Buffer): Generator<FrameExtractorItem> {
    let workingBuffer = buffer;
    while (workingBuffer.length >= 4) {
      const size = workingBuffer.readUInt32BE();
      if (size === 0) {
        yield { type: 'end' };
        return;
      }
      if (workingBuffer.length < size + 4) {
        yield { type: 'incomplete', remaining: workingBuffer };
        return;
      }
      yield {
        type: 'frame',
        frame: workingBuffer.subarray(4, size + 4)
      };
      workingBuffer = Buffer.from(workingBuffer.subarray(size + 4));
    }
    yield { type: 'incomplete', remaining: workingBuffer };
  }

  private _startPos = 0;
  private _reading = true;
  private _buffer: Buffer = Buffer.alloc(0);
  private _task: IRegisteredAsyncTask | undefined;

  async *_read(end: number) {
    const fileStream = FileSystem.createReadStream(this._fileName, {
      start: this._startPos,
      end,
      highWaterMark: 64 * 1024
    });
    for await (const chunk of fileStream) {
      assert(chunk instanceof Buffer);
      this._buffer = Buffer.concat([this._buffer, chunk]);
      this._startPos += chunk.length;
      for (const result of this._extractFrames(this._buffer)) {
        if (result.type === 'end') {
          this._reading = false;
          this._task?.unregister();
          return;
        }
        if (result.type === 'frame') {
          yield result.frame;
        } else {
          this._buffer = result.remaining;
        }
      }
    }
  }

  async *read(): AsyncIterableIterator<Buffer> {
    assert(this._task === undefined, 'read is already in progress');
    this._task = Exit.registerAsyncTask({
      name: `FramedStreamReader(${this._fileName})`,
      stop: () => {
        this._reading = false;
      }
    });

    while (this._reading) {
      const stats = await FileSystem.stat(this._fileName);
      if (stats.size > this._startPos) {
        yield* this._read(stats.size - 1);
      }
      if (this._reading) {
        await setTimeout(this._pollIntervalMs);
      }
    }
  }
}
