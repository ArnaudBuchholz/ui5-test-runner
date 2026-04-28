import { it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FramedStreamReader } from './FramedStreamReader.js';
import { Exit, FileSystem } from '../../platform/index.js';
import { setTimeout } from 'node:timers/promises';
import type { ReadStream } from 'node:fs';

const FILENAME = '/usr/arnaud/test.bin';

let fileContent: Buffer;
let fileStat: { size: number };
let isReadingStream: boolean;

beforeEach(() => {
  vi.clearAllMocks();
  fileContent = Buffer.alloc(0);
  fileStat = { size: 0 };
  isReadingStream = false;

  vi.mocked(FileSystem.stat).mockResolvedValue(fileStat as Awaited<ReturnType<typeof FileSystem.stat>>);

  vi.mocked(FileSystem.createReadStream).mockImplementation((path, options) => {
    expect.assert(!isReadingStream, 'createReadStream called while another stream is being read');
    isReadingStream = true;
    expect.assert(options && typeof options === 'object', 'createReadStream options are missing');
    expect.assert(typeof options.start === 'number', 'start option is missing');
    expect.assert(typeof options.end === 'number', 'end option is missing');
    const view = fileContent.subarray(options.start, options.end + 1);
    const mockedStream = {
      async *[Symbol.asyncIterator]() {
        await setTimeout(10);
        yield view;
        isReadingStream = false;
      }
    };
    return mockedStream as ReadStream;
  });
});

let writerPromise: Promise<void>;

async function writeToFile(writes: { delay: number; buffer: number[] }[]) {
  for (const { delay, buffer } of writes) {
    if (delay) {
      await setTimeout(delay);
    }
    fileContent = Buffer.concat([fileContent, Buffer.from(buffer)]);
    fileStat.size += buffer.length;
  }
}

afterEach(() => writerPromise);

const nullChunk = [0, 0, 0, 0];

it('ends on null buffer', async () => {
  writerPromise = writeToFile([
    {
      delay: 0,
      buffer: nullChunk
    }
  ]);

  const stream = FramedStreamReader.create(FILENAME);
  const chunks: Buffer[] = [];
  for await (const chunk of stream.read()) {
    chunks.push(chunk);
  }
  expect(chunks.length).toStrictEqual(0);
});

const header = (size: number) => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(size, 0);
  return buffer;
};

const chunk = (data: string) => {
  const buffer = Buffer.from(data);
  return [...header(data.length), ...buffer];
};

it('reads a single chunk in one go', async () => {
  const data = 'hello world';

  writerPromise = writeToFile([
    { delay: 100, buffer: chunk(data) },
    { delay: 10, buffer: nullChunk }
  ]);

  const stream = FramedStreamReader.create(FILENAME, 50);
  const chunks: Buffer[] = [];
  for await (const chunk of stream.read()) {
    chunks.push(chunk);
  }

  expect(chunks.length).toStrictEqual(1);
  expect(chunks[0]!.toString()).toStrictEqual(data);
});

it('reads multiple chunks written in one go', async () => {
  const data1 = 'chunk1';
  const data2 = 'chunk2';

  writerPromise = writeToFile([{ delay: 0, buffer: [...chunk(data1), ...chunk(data2), ...nullChunk] }]);

  const stream = FramedStreamReader.create(FILENAME);
  const chunks: Buffer[] = [];
  for await (const chunk of stream.read()) {
    chunks.push(chunk);
  }

  expect(chunks.length).toStrictEqual(2);
  expect(chunks[0]!.toString()).toStrictEqual(data1);
  expect(chunks[1]!.toString()).toStrictEqual(data2);
});

it('handles a chunk split across multiple writes', async () => {
  const data = 'a long chunk of data';
  const buffer = Buffer.from(data);

  writerPromise = writeToFile([
    { delay: 50, buffer: [...header(data.length), ...buffer.subarray(0, 5)] },
    { delay: 100, buffer: [...buffer.subarray(5)] },
    { delay: 10, buffer: [0, 0, 0, 0] } // end
  ]);

  const stream = FramedStreamReader.create(FILENAME, 50);
  const chunks: Buffer[] = [];
  for await (const chunk of stream.read()) {
    chunks.push(chunk);
  }

  expect(chunks.length).toStrictEqual(1);
  expect(chunks[0]!.toString()).toStrictEqual(data);
});

it('can be interrupted through Exit', async () => {
  let stop: (() => void | Promise<void>) | undefined;
  vi.mocked(Exit.registerAsyncTask).mockImplementation((task) => {
    stop = task.stop;
    return {
      [Symbol.dispose]: vi.fn()
    };
  });
  const data1 = 'chunk1';
  const data2 = 'chunk2';

  writerPromise = writeToFile([{ delay: 0, buffer: [...chunk(data1), ...chunk(data2), ...nullChunk] }]);

  const stream = FramedStreamReader.create(FILENAME);
  const chunks: Buffer[] = [];
  for await (const chunk of stream.read()) {
    expect.assert(stop !== undefined);
    await stop();
    chunks.push(chunk);
  }

  expect(chunks.length).toStrictEqual(1);
  expect(chunks[0]!.toString()).toStrictEqual(data1);
});

it('can be interrupted through AbortSignal', async () => {
  const controller = new AbortController();
  const data1 = 'chunk1';
  const data2 = 'chunk2';

  writerPromise = writeToFile([{ delay: 0, buffer: [...chunk(data1), ...chunk(data2), ...nullChunk] }]);

  const stream = FramedStreamReader.create(FILENAME);
  const chunks: Buffer[] = [];
  for await (const chunk of stream.read(controller.signal)) {
    chunks.push(chunk);
    controller.abort();
  }

  expect(chunks.length).toStrictEqual(1);
  expect(chunks[0]!.toString()).toStrictEqual(data1);
});

it('short-circuits the poll interval when the abort signal is received', async () => {
  const controller = new AbortController();
  const stream = FramedStreamReader.create(FILENAME, 60_000);

  const readPromise = (async () => {
    for await (const _ of stream.read(controller.signal)) {
      // Just consuming
    }
  })();

  await setTimeout(10); // Wait for the reader to reach the polling loop
  const start = Date.now();
  controller.abort();
  await readPromise;
  expect(Date.now() - start).toBeLessThan(1000);
});
