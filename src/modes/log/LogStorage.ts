import { LogLevel } from '../../platform/logger/types.js';
import type { InternalLogAttributes } from '../../platform/logger/types.js';
import { MAX_LIMIT } from './ILogStorage.js';
import type { ILogStorage, LogStorageQuery } from './ILogStorage.js';
import { punyexpr } from 'punyexpr';

const LOG_LEVELS = Object.fromEntries(Object.entries(LogLevel).map(([name, value]) => [value, name]));

export class LogStorage implements ILogStorage {
  static create(): ILogStorage {
    return new this();
  }

  private _logs: InternalLogAttributes[] = [];
  private _logsAdded = false;

  protected constructor() {}

  get length() {
    return this._logs.length;
  }

  add(log: Readonly<InternalLogAttributes>): void {
    this._logs.push(log);
    this._logsAdded = true;
  }

  private _sortIfNeeded() {
    if (!this._logsAdded) {
      return;
    }

    this._logs.sort((a, b) => a.timestamp - b.timestamp);
    this._logsAdded = false;
  }

  static buildFilterExpression(filter: string): (log: Readonly<InternalLogAttributes>) => boolean {
    const expression = punyexpr(filter);

    return (log) =>
      !!expression({
        ...log,
        level: LOG_LEVELS[log.level],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- handle all possible situations
        [punyexpr.propertyOf]: (value: any, property: string) => {
          if (value === undefined) {
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access -- handle all possible situations
          return value[property];
        }
      });
  }

  #fetch(
    query: Required<LogStorageQuery> & { cappedLimit: number; hasRange: boolean; hasFilter: boolean }
  ): Readonly<InternalLogAttributes>[] {
    const { from, to, filter, skip, cappedLimit, hasRange, hasFilter } = query;
    const filterExpression = hasFilter ? LogStorage.buildFilterExpression(filter) : null;
    let startIndex = 0;
    if (hasRange) {
      startIndex = this._logs.findIndex((log) => log.timestamp >= from);
      if (startIndex === -1) {
        return [];
      }
    }
    const records: InternalLogAttributes[] = [];
    let skipped = 0;
    for (let index = startIndex; index < this._logs.length && records.length < cappedLimit; ++index) {
      const log = this._logs[index]!;
      if (hasRange && log.timestamp > to) {
        break;
      }
      if (filterExpression && !filterExpression(log)) {
        continue;
      }
      if (skipped < skip) {
        ++skipped;
        continue;
      }
      records.push(log);
    }
    return records;
  }

  fetch(query: LogStorageQuery = {}): Readonly<InternalLogAttributes>[] {
    this._sortIfNeeded();
    const { from = 0, to = Number.MAX_SAFE_INTEGER, filter = '', skip = 0, limit = MAX_LIMIT } = query;
    const cappedLimit = Math.min(limit, MAX_LIMIT);
    const hasRange = from !== 0 || to !== Number.MAX_SAFE_INTEGER;
    const hasFilter = filter !== '';
    if (!hasRange && !hasFilter) {
      return this._logs.slice(skip, skip + Math.max(cappedLimit, 0));
    }
    return this.#fetch({ from, to, filter, skip, limit, cappedLimit, hasRange, hasFilter });
  }
}
