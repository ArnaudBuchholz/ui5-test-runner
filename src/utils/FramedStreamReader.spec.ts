import { it, expect, vi } from 'vitest';
import { FramedStreamReader } from './FramedStreamReader.js';
import { FileSystem } from '../platform/index.js';
import { setTimeout } from 'node:timers/promises';

const FILENAME = '/usr/arnaud/test.bin';

const setup = async (writes: { delay: number; buffer: number[] }[]) => {
  const stat = {
    size: 0
  };
  vi.mocked(FileSystem.stat).mockResolvedValue(stat as Awaited<ReturnType<typeof FileSystem.stat>>);
  let content = Buffer.alloc(0);
  const mockedStream = FileSystem.createReadStream(FILENAME);
  vi.mocked(FileSystem.createReadStream).mockImplementation((path, options) => {
    expect.assert(options !== undefined && typeof options === 'object');
    expect.assert(options.start !== undefined);
    expect.assert(options.end !== undefined);
    const view = content.subarray(options.start, options.end + 1);
    Object.assign(mockedStream, {
      async *[Symbol.asyncIterator]() {
        await setTimeout(10);
        yield view;
      }
    });
    return mockedStream;
  });

  for (const { delay, buffer } of writes) {
    if (delay) {
      await setTimeout(delay);
    }
    content = Buffer.concat([content, Buffer.from(buffer)]);
    stat.size += buffer.length;
  }
};

it('ends on null buffer', { timeout: 5_000_000 }, async () => {
  void setup([
    {
      delay: 0,
      buffer: [0, 0, 0, 0]
    }
  ]);

  const stream = FramedStreamReader.create(FILENAME);
  const chunks: Buffer[] = [];
  for await (const chunk of stream.read()) {
    chunks.push(chunk);
  }
  expect(chunks.length).toStrictEqual(0);
});
