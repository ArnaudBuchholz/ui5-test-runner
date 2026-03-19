import { it, expect, vi, beforeEach } from 'vitest';
import { FramedStreamWriter } from './FramedStreamWriter.js';
import { FileSystem } from '../platform/index.js';

const FILENAME = '/usr/arnaud/test.bin';

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
  expect(stream.write).toHaveBeenNthCalledWith(1, Buffer.from([0, 0, 0, 4]));
  expect(stream.write).toHaveBeenNthCalledWith(2, Buffer.from([97, 98, 99, 100]));
});

it('ends the stream on end', () => {
  const writer = TestFramedStreamWriter.create(FILENAME) as TestFramedStreamWriter;
  const stream = writer.stream;
  writer.end();
  expect(stream.end).toHaveBeenCalledOnce();
});
