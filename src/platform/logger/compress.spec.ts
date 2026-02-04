import { it, expect, describe } from 'vitest';
import type { InternalLogAttributes } from './types.js';
import { LogLevel } from './types.js';
import {
  createCompressionContext,
  compress,
  uncompress,
  DIGITS,
  MAX_TIMESTAMP_DIGITS,
  MAX_DWORD_DIGITS
} from './compress.js';

const examples = [
  {
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: 123,
    threadId: 456,
    isMainThread: true,
    source: 'job',
    message: 'Simple trace'
  },
  {
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: 123,
    threadId: 456,
    isMainThread: true,
    source: 'job',
    message: 'Trace with data',
    data: { hello: 'World !' }
  },
  {
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: 123,
    threadId: 789,
    isMainThread: false,
    source: 'job',
    message: 'Trace with complex data',
    data: { hello: 'World !', object: { property: 123, test: 'abc:' } }
  },
  {
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: 456,
    threadId: -1, // Unknown
    isMainThread: false,
    source: 'job',
    message: 'Trace from external process'
  },
  {
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: 123,
    threadId: 789,
    isMainThread: false,
    source: 'job',
    message: 'with error',
    error: {
      name: 'Error',
      message: 'error',
      stack: 'stack1',
      cause: {
        name: 'Error',
        message: 'cause',
        stack: 'stack2'
      }
    }
  },
  {
    timestamp: Date.now(),
    level: LogLevel.info,
    processId: 123,
    threadId: 789,
    isMainThread: false,
    source: 'job',
    message: 'with error and data',
    data: { hello: 'World !', object: { property: 123, test: 'abc:' } },
    error: {
      name: 'Error',
      message: 'error',
      stack: 'stack1',
      cause: {
        name: 'Error',
        message: 'cause',
        stack: 'stack2'
      }
    }
  }
] satisfies InternalLogAttributes[];

it('supports timestamps until 2200', () => {
  const maxTimeStamp = DIGITS.length ** MAX_TIMESTAMP_DIGITS;
  expect(new Date(2200, 0, 1, 0, 0, 0, 0).getTime()).toBeLessThanOrEqual(maxTimeStamp);
});

it('supports DWORD encoding', () => {
  const maxDwordValue = DIGITS.length ** MAX_DWORD_DIGITS;
  expect(2 ** 32).toBeLessThanOrEqual(maxDwordValue);
});

for (const attributes of examples) {
  describe(attributes.message, () => {
    let compressed: string;

    it('reduces message size', () => {
      const context = createCompressionContext();
      const json = JSON.stringify(attributes);
      compressed = compress(context, attributes);
      expect(compressed.length).toBeLessThan(json.length);
    });

    it('ends the compressed buffer with a carriage return', () => {
      expect(compressed.endsWith('\n')).toBe(true);
    });

    it('keeps the message integrity', () => {
      const context = createCompressionContext();
      const uncompressed = uncompress(context, compressed);
      expect.assert(uncompressed.length === 1);
      expect(uncompressed[0]).toStrictEqual(attributes);
    });
  });
}

it('does not duplicate information', () => {
  const context = createCompressionContext();
  const parts: string[] = [];
  for (const attributes of examples) {
    parts.push(compress(context, attributes));
  }
  const compressed = parts.join('');
  for (const line of compressed.split('\n')) {
    if (line) {
      // Ensure the line appears only once
      expect(compressed.split(line).length).toStrictEqual(2);
    }
  }
});

it('detects unexpected situation', () => {
  const compressed = compress(createCompressionContext(), examples[0]!);
  expect(() => uncompress(createCompressionContext(), compressed.trim().split('\n').at(-1)!)).toThrowError(
    'Invalid process index 0 (length: 0)'
  );
});
