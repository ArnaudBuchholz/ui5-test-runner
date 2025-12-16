import type { InternalLogAttributes } from './types.js';
import { LogLevel } from './types.js';

const CONTEXT_PROCESS_ID = 'p';
const CONTEXT_THREAD_ID = 't';
const CONTEXT_SOURCE_ID = 's';

/** Used to keep track of constantly repeated values */
class CompressionContext {
  private _processIds: number[];
  private _threadIds: number[];
  private _sources: string[];

  constructor() {
    this._processIds = [];
    this._threadIds = [];
  }

  private fail(message: string): never {
    throw new Error(message);
  }

  private _compressNumberFromList({ array, value, maxValueDigits, maxIndexDigits, contextKey }: {
    array: number[];
    value: number;
    maxValueDigits: number;
    maxIndexDigits: number;
    contextKey: string;
  }): { context: string; compressed: string } {
    const index = array.indexOf(value);
    if (index !== -1) {
      const compressed = compressNumber(index, maxIndexDigits);

      if (uncompressNumber(compressed) )
      return {
        context: '',
        compressed: 
      }
    }
    array.push(value);
    const lastIndex = this._processIds.length - 1;
    return {
      context: `${contextKey}${compressNumber(value, maxValueDigits)}\n`,
      compressed: compressNumber(lastIndex, maxIndexDigits)
    }
  }

  private _uncompressNumberFromList({ array, compressed }: {
    array: number[];
    compressed: string;

  }): number {
    const index = uncompressNumber(compressed);
    return array[index] ?? this.fail('Invalid process id');
  }

  compressProcessId(value: number): { context: string; compressed: string } {
    return this._compressNumberFromList({
        array: this._processIds,
        value,
        maxValueDigits: MAX_DWORD_DIGITS,
        maxIndexDigits: MAX_INDEX_DIGITS,
        contextKey: CONTEXT_PROCESS_ID
    });
  }

  uncompressProcessId(compressed: string): number {
    return this._uncompressNumberFromList({
        array: this._processIds,
        compressed
    });
  }

  compressThreadId(value: number): { context: string; compressed: string } {
    return this._compressNumberFromList({
        array: this._threadIds,
        value,
        maxValueDigits: MAX_DWORD_DIGITS,
        maxIndexDigits: MAX_INDEX_DIGITS,
        contextKey: CONTEXT_THREAD_ID
    });
  }

  uncompressThreadId(compressed: string): number {
    return this._uncompressNumberFromList({
        array: this._threadIds,
        compressed
    });
  }
}

export const createCompressionContext = () => new CompressionContext();

const MAX_TIMESTAMP_DIGITS = 8;
const MAX_DWORD_DIGITS = 6;
const MAX_INDEX_DIGITS = 2; // 62**2=3844 values
const LEVEL_MAPPING: { [key in LogLevel]: string } = {
  [LogLevel.debug]: 'D',
  [LogLevel.info]: 'I',
  [LogLevel.warn]: 'W',
  [LogLevel.error]: 'E',
  [LogLevel.fatal]: 'F',
};

const DIGITS = '0123456798abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const compressNumber = (value: number, maxLength: number): string => {
  const digits: string[] = [];
  while (value > 0) {
    let digit = value % DIGITS.length;
    digits.push(DIGITS[digit]!);
    value = (value - digit) / DIGITS.length;
  }
  return digits.join('').padEnd(maxLength, '0');
};

const uncompressNumber = (value: string): number => {
  let result = 0;
  let factor = 1;
  for (const digit of value) {
    const index = DIGITS.indexOf(digit);
    result += index * factor;
    factor *= DIGITS.length;
  }
  return result;
}

export const compress = (context: CompressionContext, attributes: InternalLogAttributes): string => {
  const compressed: string = [];
  const { level, timestamp, processId, threadId, isMainThread, source, message, data } = attributes;
  let processIdIndex = context.processIds.indexOf(processId)
  if (context.processIds)
  const cLevel = LEVEL_MAPPING[level];
  const cTimestamp = compressNumber(timestamp, MAX_TIMESTAMP_DIGITS);
  const cProcessId = context.compressProcessId(processId);
  const cThreadId = context.compressThreadId(threadId);
  const cIsMainThread = isMainThread ? '!': '';
  const cSource = context.compressSource(source);




    const compressed = `${level.toString()}${reduceNumber(timestamp)}:${reduceNumber(processId)}:${reduceNumber(threadId)}${isMainThread ? '!' : ''}:${source}:${message}`;
    gzBuffer.push(data ? [compressed, data] : compressed);
    if (gzBuffer.length >= MAX_BUFFER_SIZE) {
      gzFlushBuffer();
    } else if (!gzFlushTimeout) {
      gzFlushTimeout = setTimeout(gzFlushBuffer, FLUSH_INTERVAL_MS);
    }

}

export const uncompress = (context: CompressionContext, compressed: string): InternalLogAttributes | null => {
  return null; // augmented context
}
