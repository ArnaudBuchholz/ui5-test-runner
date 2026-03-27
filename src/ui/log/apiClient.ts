import type { LogEntry, QueryMetrics, QueryResult } from './types.js';
import { LogLevel } from '../../platform/logger/types.js';

const LEVEL_NAMES: Record<number, string> = {
  [LogLevel.debug]: 'debug',
  [LogLevel.info]: 'info',
  [LogLevel.warn]: 'warn',
  [LogLevel.error]: 'error',
  [LogLevel.fatal]: 'fatal'
};

function parseMetrics(headers: Headers): QueryMetrics {
  return {
    chunksCount: Number(headers.get('x-metrics-chunks-count') ?? 0),
    inputSize: Number(headers.get('x-metrics-input-size') ?? 0),
    outputSize: Number(headers.get('x-metrics-output-size') ?? 0),
    logsCount: Number(headers.get('x-metrics-logs-count') ?? 0)
  };
}

function isLogEntryArray(value: unknown): value is LogEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).timestamp === 'number' &&
        typeof (item as Record<string, unknown>).level === 'number'
    )
  );
}

export interface QueryParameters {
  from?: number;
  to?: number;
  filter?: string;
}

export async function queryLogs(parameters: QueryParameters): Promise<QueryResult> {
  const search = new URLSearchParams();
  if (parameters.from !== undefined) {
    search.set('from', String(parameters.from));
  }
  if (parameters.to !== undefined) {
    search.set('to', String(parameters.to));
  }
  if (parameters.filter) {
    search.set('filter', parameters.filter);
  }
  search.set('limit', '1000');

  const url = `/query?${search.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Query failed: ${response.status} ${response.statusText}`);
  }

  const metrics = parseMetrics(response.headers);
  const json: unknown = await response.json();
  if (!isLogEntryArray(json)) {
    throw new TypeError('Unexpected response format');
  }

  return { entries: json, metrics };
}

export function levelToString(level: number): string {
  return LEVEL_NAMES[level] ?? String(level);
}
