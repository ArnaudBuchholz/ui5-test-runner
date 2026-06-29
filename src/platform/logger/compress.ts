import type { InternalLogAttributes, LogSource } from './types.js';
import { LogLevel } from './types.js';
import { isDeepStrictEqual } from 'node:util';
import assert from 'node:assert/strict';
import { split } from '../../utils/shared/string.js';

const ASCII_RECORD_SEPARATOR = '\u001E';

export const DIGITS = Array.from({ length: 127 - 32 }, () => 0)
  .map((_, index) => String.fromCodePoint(32 + index))
  .join('');
const JSON_VALUE_SEP = ASCII_RECORD_SEPARATOR;
const MAX_INDEX_DIGITS = 2; // 95**2=9025 values
const CONTEXT_PROCESS_ID = 'p';
const CONTEXT_SOURCE_ID = 's';
export const MAX_TIMESTAMP_DIGITS = 7;
export const MAX_DWORD_DIGITS = 5;

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
      const compressed = Context.compressNumber(index, MAX_INDEX_DIGITS);
      return {
        context: '', // empty string: already registered, no context line needed
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

  private _uncompressFromList<T>({ type, array, compressed }: { type: string; array: T[]; compressed: string }): T {
    const index = Context.uncompressNumber(compressed);
    return array[index] ?? this.fail(`Invalid ${type} index ${index} (length: ${array.length})`);
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

export const createCompressionContext = () => new Context() as unknown;

const LEVEL_MAPPING: { [key in LogLevel]: string } = {
  [LogLevel.debug]: 'D',
  [LogLevel.info]: 'I',
  [LogLevel.warn]: 'W',
  [LogLevel.error]: 'E',
  [LogLevel.fatal]: 'F'
} as const;
const LEVELS = Object.values(LEVEL_MAPPING).join('');

interface DataSlot {
  readonly width: number; // > 0: fixed char count; 0: variable-width (takes the rest of the line)
  compress(context: Context, attributes: InternalLogAttributes): { contextLine?: string; compressed: string };
  uncompress(context: Context, compressed: string): Partial<InternalLogAttributes>;
}

const levelSlot: DataSlot = {
  width: 1,
  compress(_, { level }) {
    return { compressed: LEVEL_MAPPING[level] };
  },
  uncompress(_, compressed) {
    return { level: LEVELS.indexOf(compressed) as LogLevel };
  }
};

const timestampSlot: DataSlot = {
  width: MAX_TIMESTAMP_DIGITS,
  compress(_, { timestamp }) {
    return { compressed: Context.compressNumber(timestamp, MAX_TIMESTAMP_DIGITS) };
  },
  uncompress(_, compressed) {
    return { timestamp: Context.uncompressNumber(compressed) };
  }
};

const processSlot: DataSlot = {
  width: MAX_INDEX_DIGITS,
  compress(context, { processId, threadId, isMainThread }) {
    const { context: contextLine, compressed } = context.compressProcess({ processId, threadId, isMainThread });
    return { contextLine: contextLine || undefined, compressed };
  },
  uncompress(context, compressed) {
    return context.uncompressProcess(compressed);
  }
};

const sourceSlot: DataSlot = {
  width: MAX_INDEX_DIGITS,
  compress(context, { source }) {
    const { context: contextLine, compressed } = context.compressSource(source);
    return { contextLine: contextLine || undefined, compressed };
  },
  uncompress(context, compressed) {
    return { source: context.uncompressSource(compressed) as LogSource };
  }
};

const pageIdSlot: DataSlot = {
  width: MAX_INDEX_DIGITS,
  compress(_, { pageId }) {
    return { compressed: Context.compressNumber(pageId === undefined ? 0 : pageId + 1, MAX_INDEX_DIGITS) };
  },
  uncompress(_, compressed) {
    const value = Context.uncompressNumber(compressed);
    return value > 0 ? { pageId: value - 1 } : {};
  }
};

const messageAndExtraSlot: DataSlot = {
  width: 0,
  compress(_, { message, data, error }) {
    const parts = [message.replaceAll(/\r?\n/g, '\r')];
    if (data || error) {
      parts.push(
        JSON_VALUE_SEP,
        JSON.stringify([data ?? 0, error ?? 0]).replaceAll(/"(\w+)":/g, (_, name) => `${name}${JSON_VALUE_SEP}`)
      );
    }
    return { compressed: parts.join('') };
  },
  uncompress(_, compressed) {
    const startOfJson = compressed.indexOf(JSON_VALUE_SEP);
    if (startOfJson === -1) {
      return { message: compressed.replaceAll('\r', '\n') };
    }
    const message = compressed.slice(0, startOfJson).replaceAll('\r', '\n');
    const json = compressed
      .slice(startOfJson + 1)
      // eslint-disable-next-line security/detect-non-literal-regexp -- Use constant rather than repeat the char code
      .replaceAll(new RegExp(String.raw`(\w+)${JSON_VALUE_SEP}`, 'g'), (_, name) => `"${name}":`);
    const [data, error] = JSON.parse(json) as [data: object | 0, error: object | 0];
    return {
      message,
      ...(data ? { data } : {}),
      ...(error ? { error } : {})
    };
  }
};

const DATA_LINE_SLOTS: DataSlot[] = [
  levelSlot,
  timestampSlot,
  processSlot,
  sourceSlot,
  pageIdSlot,
  messageAndExtraSlot
];
const FIXED_SLOTS = DATA_LINE_SLOTS.filter((s) => s.width > 0);
const FIXED_SLOT_WIDTHS = FIXED_SLOTS.map((s) => s.width);
const VARIABLE_SLOTS = DATA_LINE_SLOTS.filter((s) => s.width === 0);
assert.ok(VARIABLE_SLOTS.length === 1, 'DATA_LINE_SLOTS must contain exactly one variable-width slot');
const VARIABLE_SLOT = VARIABLE_SLOTS[0]!;

/** Each entry documents how the field is compressed; the Record type ensures no field is missed when InternalLogAttributes changes */
export const _ALL_LOG_ATTRIBUTES_ARE_HANDLED: Record<keyof Required<InternalLogAttributes>, DataSlot> = {
  level: levelSlot,
  timestamp: timestampSlot,
  processId: processSlot,
  threadId: processSlot,
  isMainThread: processSlot,
  source: sourceSlot,
  pageId: pageIdSlot,
  message: messageAndExtraSlot,
  data: messageAndExtraSlot,
  error: messageAndExtraSlot
};

export const compress = (context: unknown, attributes: InternalLogAttributes): string => {
  assert.ok(context instanceof Context);
  const contextLines: string[] = [];
  const parts: string[] = [];
  for (const slot of DATA_LINE_SLOTS) {
    const { contextLine, compressed } = slot.compress(context, attributes);
    if (contextLine) contextLines.push(contextLine);
    parts.push(compressed);
  }
  return [...contextLines, parts.join('')].join('\n') + '\n';
};

const augmentContext = (context: Context, line: string) => {
  const firstChar = line.charAt(0);
  if (firstChar === CONTEXT_PROCESS_ID) {
    context.addProcess(line);
  } else {
    assert.ok(firstChar === CONTEXT_SOURCE_ID, `unexpected context operator ${firstChar}`);
    context.addSource(line);
  }
};

const uncompressLine = (context: Context, line: string): InternalLogAttributes | undefined => {
  const firstChar = line.charAt(0);
  if (!LEVELS.includes(firstChar)) {
    augmentContext(context, line);
    return;
  }
  const parts = split(line, ...FIXED_SLOT_WIDTHS);
  const attributes: Partial<InternalLogAttributes> = {};
  for (const [index, fixedSlot] of FIXED_SLOTS.entries()) {
    Object.assign(attributes, fixedSlot.uncompress(context, parts[index]!));
  }
  Object.assign(attributes, VARIABLE_SLOT.uncompress(context, parts[FIXED_SLOTS.length]!));
  return attributes as InternalLogAttributes;
};

export const uncompress = (context: unknown, compressed: string): InternalLogAttributes[] => {
  assert.ok(context instanceof Context);
  const result: InternalLogAttributes[] = [];
  for (const line of compressed.split('\n')) {
    if (!line) {
      continue;
    }
    const attributes = uncompressLine(context, line);
    if (attributes) {
      result.push(attributes);
    }
  }
  return result;
};
