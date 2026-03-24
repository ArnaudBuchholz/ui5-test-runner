import type { InternalLogAttributes } from '../../platform/logger/types.js';
import { MAX_LIMIT } from './ILogStorage.js';
import type { ILogStorage, LogStorageQuery } from './ILogStorage.js';
import { punyexpr } from 'punyexpr';

export class LogStorage implements ILogStorage {
  static create(): ILogStorage {
    return new this();
  }

  private _logs: InternalLogAttributes[] = [];
  private _lastTimestamp = 0;

  protected constructor() {}

  add(log: InternalLogAttributes): void {
    const { timestamp } = log;
    this._logs.push(log);
    if (timestamp > this._lastTimestamp) {
      this._lastTimestamp = timestamp;
    } else {
      this._logs.sort((a, b) => a.timestamp - b.timestamp);
    }
  }

  fetch(query: LogStorageQuery = {}): InternalLogAttributes[] {
    const { from = 0, to = Number.MAX_SAFE_INTEGER, filter = '' } = query;
    let { skip = 0, limit = MAX_LIMIT } = query;
    const filterExpr = filter ? punyexpr(filter) : () => true;
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }
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
      if (!filterExpr(log)) {
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
