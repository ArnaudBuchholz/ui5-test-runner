import { it, expect, vi, beforeEach } from 'vitest';
import { FramedStreamWriter } from './FramedStreamWriter.js';
import { FileSystem } from '../platform/index.js';

const FILENAME = '/usr/arnaud/test.bin';
const expectCallback = expect.any(Function) as () => void;

class TestFramedStreamWriter extends FramedStreamWriter {
  get stream() {
    return this._stream;
  }
}

beforeEach(() => vi.clearAllMocks());

it('opens a writable stream', () => {
  TestFramedStreamWriter.create(FILENAME);
  expect(FileSystem.createWriteStream).toHaveBeenCalledWith(FILENAME);
});

it('writes chunk of data preceded by a header indicating the length', async () => {
  const writer = TestFramedStreamWriter.create(FILENAME) as TestFramedStreamWriter;
  const stream = writer.stream;
  await writer.write(Buffer.from('abcd'));
  expect(stream.write).toHaveBeenNthCalledWith(1, Buffer.from([0, 0, 0, 4]), expectCallback);
  expect(stream.write).toHaveBeenNthCalledWith(2, Buffer.from([97, 98, 99, 100]), expectCallback);
});

it('does nothing on empty buffers', async () => {
  const writer = TestFramedStreamWriter.create(FILENAME) as TestFramedStreamWriter;
  const stream = writer.stream;
  await writer.write(Buffer.from(''));
  expect(stream.write).not.toHaveBeenCalled();
});

it('ends the stream by writing a null header', async () => {
  const writer = TestFramedStreamWriter.create(FILENAME) as TestFramedStreamWriter;
  const stream = writer.stream;
  await writer.end();
  expect(stream.write).toHaveBeenNthCalledWith(1, Buffer.from([0, 0, 0, 0]), expectCallback);
  expect(stream.end).toHaveBeenCalledOnce();
});
