import type { LogLevel } from '../../platform/logger/types.js';

export interface LogEntry {
  readonly timestamp: number;
  readonly level: LogLevel;
  readonly processId: number;
  readonly threadId: number;
  readonly isMainThread: boolean;
  readonly source: string;
  readonly message: string;
  readonly data?: object;
}

export interface QueryMetrics {
  chunksCount: number;
  inputSize: number;
  outputSize: number;
  logsCount: number;
}

export interface QueryResult {
  entries: LogEntry[];
  metrics: QueryMetrics;
}

export type TimeRangeMode = 'relative' | 'absolute';

export type RelativePreset = '5m' | '15m' | '30m' | '1h' | '3h' | '6h' | '24h';

export interface RelativeTimeRange {
  readonly mode: 'relative';
  readonly preset: RelativePreset;
}

export interface AbsoluteTimeRange {
  readonly mode: 'absolute';
  readonly from: number;
  readonly to: number;
}

export type TimeRange = RelativeTimeRange | AbsoluteTimeRange;

export type AutoRefreshInterval = 5 | 10 | 30 | 60;

export interface State {
  timeRange: TimeRange;
  autoRefresh: boolean;
  autoRefreshInterval: AutoRefreshInterval;
  lastRefresh: number | null;
  filterExpression: string;
  searchText: string;
  filterError: string | null;
  selectedEntryIndex: number | null;
  entries: LogEntry[];
  metrics: QueryMetrics | null;
  isLive: boolean;
}
