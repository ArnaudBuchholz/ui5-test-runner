import { it, expect, vi, beforeEach } from 'vitest';
import type { LogReaderItem } from './LogReader.js';
import { LogReader, POLL_INTERVAL_MS } from './LogReader.js';
import { FramedStreamReader } from '../../utils/FramedStreamReader.js';
import { ZLib } from '../../platform/index.js';
import { createCompressionContext, uncompress } from '../../platform/logger/compress.js';

const FILENAME = 'test.log';

const stream = {
  read: vi.fn()
};

vi.spyOn(FramedStreamReader, 'create').mockReturnValue(stream);
const compressionContext = {};
vi.mocked(createCompressionContext).mockReturnValue(compressionContext);
vi.mock('../../platform/logger/compress.js');
vi.mocked(uncompress).mockImplementation((context, inflated) => {
  expect(context).toStrictEqual(compressionContext);
  return JSON.parse(inflated) as ReturnType<typeof uncompress>;
});

beforeEach(() => vi.clearAllMocks());

it('reads logs and emits status', async () => {
  const chunk = Buffer.from('compressed');
  const inflated = '[{"message":"hello"},{"message":"world !"}]';
  stream.read.mockImplementation(function* () {
    yield chunk;
  });
  vi.mocked(ZLib.inflateRawSync).mockReturnValue(Buffer.from(inflated));
  const items: LogReaderItem[] = [];
  for await (const item of LogReader.read(FILENAME)) {
    items.push(item);
  }
  expect(FramedStreamReader.create).toHaveBeenCalledWith(FILENAME, POLL_INTERVAL_MS);
  expect(ZLib.inflateRawSync).toHaveBeenCalledWith(chunk);
  expect(items).toStrictEqual<Partial<LogReaderItem>[]>([
    { type: 'log', message: 'hello' },
    { type: 'log', message: 'world !' },
    {
      type: 'status',
      inputSize: 4 + chunk.length,
      chunksCount: 1,
      outputSize: JSON.stringify({ message: 'hello' }).length + 1 + JSON.stringify({ message: 'world !' }).length + 1
    }
  ]);
});

it('accumulates stats over chunks', async () => {
  const chunk1 = Buffer.from('c1');
  const chunk2 = Buffer.from('c2');
  stream.read.mockImplementation(function* () {
    yield chunk1;
    yield chunk2;
  });
  vi.mocked(ZLib.inflateRawSync).mockReturnValue(Buffer.from('[{}]'));
  const statuses: LogReaderItem[] = [];
  for await (const item of LogReader.read(FILENAME)) {
    if (item.type === 'status') {
      statuses.push(item);
    }
  }
  expect(statuses).toHaveLength(2);
  expect(statuses).toMatchObject([
    {
      type: 'status',
      chunksCount: 1,
      inputSize: 4 + chunk1.length
    },
    {
      type: 'status',
      chunksCount: 2,
      inputSize: 4 + chunk1.length + 4 + chunk2.length
    }
  ]);
});
