import { it, expect, vi, beforeEach } from 'vitest';
import { FramedStreamWriter } from './FramedStreamWriter.js';
import { FileSystem } from '../../platform/index.js';

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

it('forwards errors (factory)', () => {
  const error = new Error('KO');
  vi.mocked(FileSystem.createWriteStream).mockImplementationOnce(() => {
    throw error;
  });
  expect(() => TestFramedStreamWriter.create(FILENAME)).toThrow(error);
});

it('forwards errors (stream)', async () => {
  const writer = TestFramedStreamWriter.create(FILENAME) as TestFramedStreamWriter;
  const stream = writer.stream;
  const error = new Error('KO');
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- Unable to fit callback
  vi.mocked(stream.write).mockImplementation(((_: any, callback: (error: any) => void) => callback(error)) as any);
  await expect(writer.write(Buffer.from('abcd'))).rejects.toThrow(error);
});
