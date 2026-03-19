import { FileSystem } from '../platform/index.js';

export interface IFramedStreamWriter {
  write(buffer: Buffer): Promise<void>;
  end(): void;
}

export class FramedStreamWriter implements IFramedStreamWriter {
  static create(fileName: string): IFramedStreamWriter {
    return new this(fileName);
  }

  protected _stream: ReturnType<typeof FileSystem.createWriteStream>;

  protected constructor(fileName: string) {
    this._stream = FileSystem.createWriteStream(fileName);
  }

  protected async _write(buffer: Buffer): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    this._stream.write(buffer, (error) => error ? reject(error) : resolve());
    await promise;
  }

  async write(buffer: Buffer): Promise<void> {
    const size = Buffer.alloc(4);
    size.writeUInt32BE(buffer.length, 0);
    this._write(size);
    this._write(buffer);
  }

  end(): void {
    this._stream.end();
  }
}
