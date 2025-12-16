import type { InternalLogAttributes } from './types.js';
import { LogLevel } from './types.js';
import { isDeepStrictEqual } from 'node:util';
import assert from 'node:assert/strict';

const DIGITS = '0123456798abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const MAX_INDEX_DIGITS = 2; // 62**2=3844 values
const CONTEXT_PROCESS_ID = 'p';
const CONTEXT_SOURCE_ID = 's';
const MAX_TIMESTAMP_DIGITS = 8;
const MAX_DWORD_DIGITS = 6;

type ProcessContext = Pick<InternalLogAttributes, 'processId' | 'threadId' | 'isMainThread'>;

/** Used to keep track of constantly repeated values */
class Context {
  static compressNumber(value: number, maxLength: number): string {
    const digits: string[] = [];
    while (value > 0) {
      const digit = value % DIGITS.length;
      digits.push(DIGITS[digit]!);
      value = (value - digit) / DIGITS.length;
    }
    return digits.join('').padEnd(maxLength, '0');
  }

  static uncompressNumber(value: string): number {
    let result = 0;
    let factor = 1;
    for (const digit of value) {
      const index = DIGITS.indexOf(digit);
      result += index * factor;
      factor *= DIGITS.length;
    }
    return result;
  }

  private fail(message: string): never {
    throw new Error(message);
  }

  private _compressWithList<T>({
    array,
    value,
    compress
  }: {
    array: T[];
    value: T;
    compress: (value: T) => string[];
  }): { context: string; compressed: string } {
    const index = array.findIndex((candidate) => isDeepStrictEqual(candidate, value));
    if (index !== -1) {
      const compressed = Context.compressNumber(index, MAX_INDEX_DIGITS);
      return {
        context: '',
        compressed
      };
    }
    const lastIndex = array.length;
    array.push(value);
    return {
      context: compress(value).join(''),
      compressed: Context.compressNumber(lastIndex, MAX_INDEX_DIGITS)
    };
  }

  private _uncompressFromList<T>({ array, compressed }: { array: T[]; compressed: string }): T {
    const index = Context.uncompressNumber(compressed);
    return array[index] ?? this.fail('Invalid index');
  }

  private _processes: ProcessContext[] = [];

  compressProcess(value: ProcessContext): { context: string; compressed: string } {
    return this._compressWithList({
      array: this._processes,
      value,
      compress: (value: ProcessContext) => [
        CONTEXT_PROCESS_ID,
        Context.compressNumber(value.processId, MAX_DWORD_DIGITS),
        Context.compressNumber(value.threadId, MAX_DWORD_DIGITS),
        value.isMainThread ? '!' : ''
      ]
    });
  }

  uncompressProcess(compressed: string): ProcessContext {
    return this._uncompressFromList({
      array: this._processes,
      compressed
    });
  }

  private _sources: string[] = [];

  compressSource(value: string): { context: string; compressed: string } {
    return this._compressWithList({
      array: this._sources,
      value,
      compress: (value: string) => [CONTEXT_SOURCE_ID, value]
    });
  }

  uncompressSource(compressed: string): string {
    return this._uncompressFromList({
      array: this._sources,
      compressed
    });
  }
}

export const createCompressionContext = () => new Context() as unknown;

const LEVEL_MAPPING: { [key in LogLevel]: string } = {
  [LogLevel.debug]: 'D',
  [LogLevel.info]: 'I',
  [LogLevel.warn]: 'W',
  [LogLevel.error]: 'E',
  [LogLevel.fatal]: 'F'
};

export const compress = (context: unknown, attributes: InternalLogAttributes): string => {
  assert.ok(context instanceof Context);
  const { level, timestamp, source, message, data } = attributes;
  const cLevel = LEVEL_MAPPING[level];
  const cTimestamp = Context.compressNumber(timestamp, MAX_TIMESTAMP_DIGITS);
  const cProcess = context.compressProcess(attributes);
  const cSource = context.compressSource(source);
  const compressed: string[] = [cLevel, cTimestamp, cProcess.compressed, cSource.compressed, message];
  if (data) {
    compressed.push('"', JSON.stringify(data));
  }
  return [cProcess.context, cSource.context, compressed.join('')].filter((line) => !!line).join('\n');
};

export const uncompress = (context: unknown, compressed: string): InternalLogAttributes | null => {
  return null; // augmented context
};
