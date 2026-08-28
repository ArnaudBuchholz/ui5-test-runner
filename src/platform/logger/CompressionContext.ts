import { isDeepStrictEqual } from 'node:util';
import { split } from '../../utils/shared/string.js';

export const DIGITS = Array.from({ length: 127 - 32 }, () => 0)
  .map((_, index) => String.fromCodePoint(32 + index))
  .join('');
export const MAX_TIMESTAMP_DIGITS = 7;
export const MAX_DWORD_DIGITS = 5;
const MAX_INDEX_DIGITS = 2; // 95**2=9025 values
const CONTEXT_PROCESS_ID = 'p';
const CONTEXT_SOURCE_ID = 's';

import type { InternalLogAttributes } from './types.js';

type ProcessContext = Pick<InternalLogAttributes, 'processId' | 'threadId' | 'isMainThread'>;

/** Used to keep track of constantly repeated values */
export class CompressionContext {
  private constructor() {}

  static create() {
    return new CompressionContext();
  }

  static compressNumber(value: number, maxLength: number): string {
    const digits: string[] = [];
    while (value > 0) {
      const digit = value % DIGITS.length;
      digits.push(DIGITS[digit]!);
      value = (value - digit) / DIGITS.length;
    }
    // eslint-disable-next-line sonarjs/argument-type -- DIGITS has at least one char
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
      const compressed = CompressionContext.compressNumber(index, MAX_INDEX_DIGITS);
      return {
        context: '', // empty string: already registered, no context line needed
        compressed
      };
    }
    const lastIndex = array.length;
    array.push(value);
    return {
      context: compress(value).join(''),
      compressed: CompressionContext.compressNumber(lastIndex, MAX_INDEX_DIGITS)
    };
  }

  private _uncompressFromList<T>({ type, array, compressed }: { type: string; array: T[]; compressed: string }): T {
    const index = CompressionContext.uncompressNumber(compressed);
    return array[index] ?? this.fail(`Invalid ${type} index ${index} (length: ${array.length})`);
  }

  private _processes: ProcessContext[] = [];

  compressProcess(value: ProcessContext): { context: string; compressed: string } {
    return this._compressWithList({
      array: this._processes,
      value,
      compress: ({ processId, threadId, isMainThread }: ProcessContext) => {
        if (threadId === -1) {
          return [CONTEXT_PROCESS_ID, CompressionContext.compressNumber(processId, MAX_DWORD_DIGITS)];
        }
        return [
          CONTEXT_PROCESS_ID,
          CompressionContext.compressNumber(processId, MAX_DWORD_DIGITS),
          CompressionContext.compressNumber(threadId, MAX_DWORD_DIGITS),
          isMainThread ? '!' : ''
        ];
      }
    });
  }

  addProcess(compressed: string) {
    const [, cProcessId, cThreadId, cIsMainThread] = split(compressed, 1, MAX_DWORD_DIGITS, MAX_DWORD_DIGITS, 1);
    if (cThreadId) {
      this._processes.push({
        processId: CompressionContext.uncompressNumber(cProcessId),
        threadId: CompressionContext.uncompressNumber(cThreadId),
        isMainThread: cIsMainThread === '!'
      });
    } else {
      this._processes.push({
        processId: CompressionContext.uncompressNumber(cProcessId),
        threadId: -1,
        isMainThread: false
      });
    }
  }

  uncompressProcess(compressed: string): ProcessContext {
    return this._uncompressFromList({
      type: 'process',
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
      type: 'source',
      array: this._sources,
      compressed
    });
  }
}
