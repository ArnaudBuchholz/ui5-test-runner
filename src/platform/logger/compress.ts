import type { InternalLogAttributes, LogSource } from './types.js';
import { LogLevel } from './types.js';
import assert from 'node:assert/strict';
import { split } from '../../utils/shared/string.js';
import { CompressionContext, MAX_TIMESTAMP_DIGITS } from './CompressionContext.js';

const ASCII_RECORD_SEPARATOR = '\u{1E}';
const JSON_VALUE_SEP = ASCII_RECORD_SEPARATOR;
const MAX_INDEX_DIGITS = 2; // 95**2=9025 values
const CONTEXT_PROCESS_ID = 'p';
const CONTEXT_SOURCE_ID = 's';

const LEVEL_MAPPING: { [key in LogLevel]: string } = {
  [LogLevel.debug]: 'D',
  [LogLevel.info]: 'I',
  [LogLevel.warn]: 'W',
  [LogLevel.error]: 'E',
  [LogLevel.fatal]: 'F'
} as const;
const LEVELS = Object.values(LEVEL_MAPPING).join('');

interface IDataSlot {
  readonly width: number; // > 0: fixed char count; 0: variable-width (takes the rest of the line)
  compress(
    context: CompressionContext,
    attributes: InternalLogAttributes
  ): { contextLine?: string; compressed: string };
  uncompress(context: CompressionContext, compressed: string): Partial<InternalLogAttributes>;
}

const levelSlot: IDataSlot = {
  width: 1,
  compress(_, { level }) {
    return { compressed: LEVEL_MAPPING[level] };
  },
  uncompress(_, compressed) {
    return { level: LEVELS.indexOf(compressed) as LogLevel };
  }
};

const timestampSlot: IDataSlot = {
  width: MAX_TIMESTAMP_DIGITS,
  compress(_, { timestamp }) {
    return { compressed: CompressionContext.compressNumber(timestamp, MAX_TIMESTAMP_DIGITS) };
  },
  uncompress(_, compressed) {
    return { timestamp: CompressionContext.uncompressNumber(compressed) };
  }
};

const processSlot: IDataSlot = {
  width: MAX_INDEX_DIGITS,
  compress(context, { processId, threadId, isMainThread }) {
    const { context: contextLine, compressed } = context.compressProcess({ processId, threadId, isMainThread });
    return { contextLine: contextLine || undefined, compressed };
  },
  uncompress(context, compressed) {
    return context.uncompressProcess(compressed);
  }
};

const sourceSlot: IDataSlot = {
  width: MAX_INDEX_DIGITS,
  compress(context, { source }) {
    const { context: contextLine, compressed } = context.compressSource(source);
    return { contextLine: contextLine || undefined, compressed };
  },
  uncompress(context, compressed) {
    return { source: context.uncompressSource(compressed) as LogSource };
  }
};

const pageIdSlot: IDataSlot = {
  width: MAX_INDEX_DIGITS,
  compress(_, { pageId }) {
    return { compressed: CompressionContext.compressNumber(pageId === undefined ? 0 : pageId + 1, MAX_INDEX_DIGITS) };
  },
  uncompress(_, compressed) {
    const value = CompressionContext.uncompressNumber(compressed);
    return value > 0 ? { pageId: value - 1 } : {};
  }
};

const messageAndExtraSlot: IDataSlot = {
  width: 0,
  compress(_, { message, data, error }) {
    const parts = [message.replaceAll(/\r?\n/g, '\r')];
    if (data || error) {
      parts.push(
        JSON_VALUE_SEP,
        JSON.stringify([data ?? 0, error ?? 0]).replaceAll(/"(\w+)":/g, (_, name) => `${name}${JSON_VALUE_SEP}`)
      );
    }
    return { compressed: parts.join('') }; // Might return empty
  },
  uncompress(_, compressed) {
    if (!compressed) {
      return {
        message: ''
      };
    }
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
      ...(data && { data }),
      ...(error && { error })
    };
  }
};

export const DATA_LINE_SLOTS: IDataSlot[] = [
  levelSlot,
  timestampSlot,
  processSlot,
  sourceSlot,
  pageIdSlot,
  messageAndExtraSlot
];
const FIXED_SLOTS = DATA_LINE_SLOTS.filter((dataSlot) => dataSlot.width > 0);
const FIXED_SLOT_WIDTHS = FIXED_SLOTS.map((dataSlot) => dataSlot.width);
const VARIABLE_SLOTS = DATA_LINE_SLOTS.filter((dataSlot) => dataSlot.width === 0);
assert.ok(VARIABLE_SLOTS.length === 1, 'DATA_LINE_SLOTS must contain exactly one variable-width slot');
const VARIABLE_SLOT = VARIABLE_SLOTS[0]!;

/**
Each entry documents how the field is compressed; the Record type ensures no field is missed when InternalLogAttributes changes
*/
export const _ALL_LOG_ATTRIBUTES_ARE_HANDLED: Record<keyof Required<InternalLogAttributes>, IDataSlot | null> = {
  level: levelSlot,
  timestamp: timestampSlot,
  processId: processSlot,
  threadId: processSlot,
  isMainThread: processSlot,
  source: sourceSlot,
  pageId: pageIdSlot,
  forceRender: null,
  message: messageAndExtraSlot,
  data: messageAndExtraSlot,
  error: messageAndExtraSlot
};

export const compress = (context: unknown, attributes: InternalLogAttributes): string => {
  assert.ok(context instanceof CompressionContext);
  const contextLines: string[] = [];
  const parts: string[] = [];
  for (const slot of DATA_LINE_SLOTS) {
    const { contextLine, compressed } = slot.compress(context, attributes);
    if (contextLine) contextLines.push(contextLine);
    parts.push(compressed);
  }
  return [...contextLines, parts.join('')].join('\n') + '\n';
};

const augmentContext = (context: CompressionContext, line: string) => {
  const firstChar = line.charAt(0);
  if (firstChar === CONTEXT_PROCESS_ID) {
    context.addProcess(line);
  } else {
    assert.ok(firstChar === CONTEXT_SOURCE_ID, `unexpected context operator ${firstChar}`);
    context.addSource(line);
  }
};

const uncompressLine = (context: CompressionContext, line: string): InternalLogAttributes | undefined => {
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
  assert.ok(context instanceof CompressionContext);
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
