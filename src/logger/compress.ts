import type { InternalLogAttributes, LogSource } from './types.js';
import { LogLevel } from './types.js';
import { isDeepStrictEqual } from 'node:util';
import assert from 'node:assert/strict';
import { split } from '../utils/string.js';

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

  addProcess(compressed: string) {
    const [, cProcessId, cThreadId, cIsMainThread] = split(compressed, 1, MAX_DWORD_DIGITS, MAX_DWORD_DIGITS, 1);
    this._processes.push({
      processId: Context.uncompressNumber(cProcessId),
      threadId: Context.uncompressNumber(cThreadId),
      isMainThread: cIsMainThread === '!'
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

  addSource(compressed: string) {
    this._sources.push(compressed.slice(1));
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
} as const;
const LEVELS = Object.values(LEVEL_MAPPING).join('');

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

export const uncompress = (context: unknown, compressed: string): InternalLogAttributes[] => {
  assert.ok(context instanceof Context);
  const result: InternalLogAttributes[] = [];
  for (const line of compressed.split('\n')) {
    const firstChar = line.charAt(0);
    const level = LEVELS.indexOf(firstChar);
    if (level === -1) {
      if (firstChar === CONTEXT_PROCESS_ID) {
        context.addProcess(line);
      } else if (firstChar === CONTEXT_SOURCE_ID) {
        context.addSource(line);
      }
    } else {
      const [, cTimestamp, cProcess, cSource, message] = split(
        line,
        1,
        MAX_TIMESTAMP_DIGITS,
        MAX_INDEX_DIGITS,
        MAX_INDEX_DIGITS
      );
      result.push({
        level: level as LogLevel,
        timestamp: Context.uncompressNumber(cTimestamp),
        ...context.uncompressProcess(cProcess),
        source: context.uncompressSource(cSource) as LogSource,
        message
      } as InternalLogAttributes);
    }
  }
  return result;
};
