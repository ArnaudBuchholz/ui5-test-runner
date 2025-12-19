import type { InternalLogAttributes, LogSource } from './types.js';
import { LogLevel } from './types.js';
import { isDeepStrictEqual } from 'node:util';
import assert from 'node:assert/strict';
import { split } from '../utils/string.js';
import { ASCII_RECORD_SEPARATOR } from '../terminal/ascii.js';

const DIGITS = Array.from({ length: 127 - 32 })
  .fill(0)
  .map((_, index) => String.fromCodePoint(32 + index))
  .join('');
const JSON_VALUE_SEP = ASCII_RECORD_SEPARATOR;
const MAX_INDEX_DIGITS = 2; // 95**2=9025 values
const CONTEXT_PROCESS_ID = 'p';
const CONTEXT_SOURCE_ID = 's';
// const CONTEXT_TIMESTAMP_ID = 't'; // TODO save ticks every seconds (when traces are generated), consider relative offset as traces might be in any order
const MAX_TIMESTAMP_DIGITS = 8;
const MAX_DWORD_DIGITS = 5;

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
    return digits.join('').padEnd(maxLength, DIGITS[0]);
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
      compress: ({ processId, threadId, isMainThread }: ProcessContext) => {
        if (threadId === -1) {
          return [CONTEXT_PROCESS_ID, Context.compressNumber(processId, MAX_DWORD_DIGITS)];
        }
        return [
          CONTEXT_PROCESS_ID,
          Context.compressNumber(processId, MAX_DWORD_DIGITS),
          Context.compressNumber(threadId, MAX_DWORD_DIGITS),
          isMainThread ? '!' : ''
        ];
      }
    });
  }

  addProcess(compressed: string) {
    const [, cProcessId, cThreadId, cIsMainThread] = split(compressed, 1, MAX_DWORD_DIGITS, MAX_DWORD_DIGITS, 1);
    if (cThreadId) {
      this._processes.push({
        processId: Context.uncompressNumber(cProcessId),
        threadId: Context.uncompressNumber(cThreadId),
        isMainThread: cIsMainThread === '!'
      });
    } else {
      this._processes.push({
        processId: Context.uncompressNumber(cProcessId),
        threadId: -1,
        isMainThread: false
      });
    }
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
  const { level, timestamp, processId, threadId, isMainThread, source, message, data } = attributes;
  const cLevel = LEVEL_MAPPING[level];
  const cTimestamp = Context.compressNumber(timestamp, MAX_TIMESTAMP_DIGITS);
  const cProcess = context.compressProcess({ processId, threadId, isMainThread });
  const cSource = context.compressSource(source);
  const compressed: string[] = [cLevel, cTimestamp, cProcess.compressed, cSource.compressed, message];
  if (data) {
    compressed.push(
      JSON_VALUE_SEP,
      JSON.stringify(data).replaceAll(/"(\w+)":/g, (_, name) => `${name}${JSON_VALUE_SEP}`)
    );
  }
  return [cProcess.context, cSource.context, compressed.join('')].filter((line) => !!line).join('\n') + '\n';
};

const augmentContext = (context: Context, line: string) => {
  const firstChar = line.charAt(0);
  if (firstChar === CONTEXT_PROCESS_ID) {
    context.addProcess(line);
  } else if (firstChar === CONTEXT_SOURCE_ID) {
    context.addSource(line);
  }
};

export const uncompress = (context: unknown, compressed: string): InternalLogAttributes[] => {
  assert.ok(context instanceof Context);
  const result: InternalLogAttributes[] = [];
  for (const line of compressed.split('\n')) {
    if (!line) {
      continue;
    }
    const firstChar = line.charAt(0);
    const level = LEVELS.indexOf(firstChar);
    if (level === -1) {
      augmentContext(context, line);
    } else {
      const [, cTimestamp, cProcess, cSource, messageAndData] = split(
        line,
        1,
        MAX_TIMESTAMP_DIGITS,
        MAX_INDEX_DIGITS,
        MAX_INDEX_DIGITS
      );
      let message: string;
      let data: unknown;
      const startOfJson = messageAndData.indexOf(JSON_VALUE_SEP);
      if (startOfJson === -1) {
        message = messageAndData ?? '';
      } else {
        message = messageAndData.slice(0, startOfJson);
        const json = messageAndData
          .slice(startOfJson + 1)
          // eslint-disable-next-line security/detect-non-literal-regexp -- Use constant rather than repeat the char code
          .replaceAll(new RegExp(String.raw`(\w+)${JSON_VALUE_SEP}`, 'g'), (_, name) => `"${name}":`);
        data = JSON.parse(json);
      }
      const attributes = {
        level: level as LogLevel,
        timestamp: Context.uncompressNumber(cTimestamp),
        ...context.uncompressProcess(cProcess),
        source: context.uncompressSource(cSource) as LogSource,
        message
      } as InternalLogAttributes;
      if (data) {
        attributes.data = data;
      }
      result.push(attributes);
    }
  }
  return result;
};
