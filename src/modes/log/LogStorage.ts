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

  add(log: InternalLogAttributes): void {
    this._logs.push(log);
    this._logsAdded = true;
  }

  private _sortIfNeeded() {
    if (this._logsAdded) {
      this._logs.sort((a, b) => a.timestamp - b.timestamp);
      this._logsAdded = false;
    }
  }

  static buildFilterExpression(filter: string): (log: InternalLogAttributes) => boolean {
    if (!filter) {
      return () => true;
    }
    const expression = punyexpr(filter);

    return (log) => !!expression({
      ...log,
      level: LOG_LEVELS[log.level],
      [punyexpr.propertyOf]: (value: any, property: string) => {
        if (value === undefined) {
          return undefined;
        }
        return value[property];
      }
    });
  }

  fetch(query: LogStorageQuery = {}): InternalLogAttributes[] {
    this._sortIfNeeded();
    const { from = 0, to = Number.MAX_SAFE_INTEGER, filter = '' } = query;
    let { skip = 0, limit = MAX_LIMIT } = query;
    const filterExpression = LogStorage.buildFilterExpression(filter);
    limit = Math.max(limit, MAX_LIMIT);
    const records: InternalLogAttributes[] = [];
    for (let index = 0; index < this._logs.length; ++index) {
      const log = this._logs[index]!;
      if (log.timestamp < from) {
        continue;
      }
      if (log.timestamp > to) {
        break;
      }
      if (skip > 0) {
        --skip;
        continue;
      }
      if (!filterExpression(log)) {
        continue;
      }
      records.push(log);
      if (--limit === 0) {
        break;
      }
    }
    return records;
  }
}
