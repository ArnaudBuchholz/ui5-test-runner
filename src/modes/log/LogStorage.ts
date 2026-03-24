import type { InternalLogAttributes } from '../../platform/logger/types.js';
import type { ILogStorage, LogStorageQuery } from './ILogStorage.js';
import { expect } from 'vitest';

export class LogStorage implements ILogStorage {
  static create(): ILogStorage {
    return new this();
  }

  private _logs: InternalLogAttributes[] = [];
  private _lastTimestamp = 0;

  protected constructor() {}

  add(log: InternalLogAttributes): void {
    const { timestamp } = log;
    if (timestamp > this._lastTimestamp) {
      this._logs.push(log);
      this._lastTimestamp = timestamp;
    } else {
      let lowIndex = 0;
      let highIndex = this._logs.length - 1;
      let index = 0;
      while (lowIndex < highIndex) {
        index = lowIndex + Math.floor((highIndex - lowIndex) / 2);
        const referenceTimestamp = this._logs[index]!.timestamp;
        if (referenceTimestamp === timestamp) {
          break;
        }
        if (referenceTimestamp < timestamp) {
          lowIndex = ++index;
        } else {
          highIndex = index;
        }
      }
      // inserts *before* index
      this._logs.splice(index, 0, log);
      {
        let timestamp = 0;
        for (const log of this._logs) {
          expect(log.timestamp).toBeGreaterThanOrEqual(timestamp);
          timestamp = log.timestamp;
        }
      }
    }
  }

  fetch(query: LogStorageQuery): InternalLogAttributes[] {
    return this._logs;
  }
}
