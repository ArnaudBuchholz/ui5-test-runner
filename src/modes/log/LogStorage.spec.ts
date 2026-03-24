import { describe, it, expect, beforeAll } from 'vitest';
import { LogStorage } from './LogStorage.js';
import { toInternalLogAttributes } from '../../platform/logger/toInternalLogAttributes.js';
import type { InternalLogAttributes } from '../../platform/logger/types.js';
import { LogLevel } from '../../platform/logger/types.js';
import type { ILogStorage } from './ILogStorage.js';
import { MAX_LIMIT } from './ILogStorage.js';

const log1 = toInternalLogAttributes({ source: 'job', message: '10' }, LogLevel.info);
log1.timestamp = 10;
const log2 = toInternalLogAttributes({ source: 'npm', message: '20' }, LogLevel.info);
log2.timestamp = 20;
const log3 = toInternalLogAttributes({ source: 'page', message: '30', data: { uid: 'page1' } }, LogLevel.info);
log3.timestamp = 30;

const fillLogs = (storage: ILogStorage, count: number) => {
  for (let index = 0; index < count; ++index) {
    const log = toInternalLogAttributes(
      { source: 'job', message: `generated ${index.toString()}` },
      Math.floor(Math.random() * 5) as LogLevel
    );
    log.timestamp = 100 + Math.floor(Math.random() * 10_000);
    storage.add(log);
  }
};

const expectLogsAreSorted = (logs: InternalLogAttributes[]) => {
  let timestamp = 0;
  for (const log of logs) {
    expect(log.timestamp).toBeGreaterThanOrEqual(timestamp);
    timestamp = log.timestamp;
  }
};

describe('add logs', () => {
  it('returns added logs', () => {
    const storage = LogStorage.create();
    storage.add(log1);
    expect(storage.fetch()).toStrictEqual([log1]);
  });

  it('returns logs in the correct order', () => {
    const storage = LogStorage.create();
    storage.add(log3);
    storage.add(log2);
    storage.add(log1);
    expect(storage.fetch()).toStrictEqual([log1, log2, log3]);
  });

  const datasets: number[][] = [
    [3, 2, 1],
    [30, 20, 10, 15, 25],
    [30, 20, 10, 15, 25, 17, 18, 19],
    [30, 20, 10, 15, 25, 17, 18, 19, 30, 20, 10, 15, 25, 17, 18, 19]
  ];

  for (const [index, dataset_] of datasets.entries()) {
    const dataset = dataset_;
    it(`returns logs in the correct order (datasets[${index}])`, () => {
      const storage = LogStorage.create();
      for (const timestamp of dataset) {
        const log = toInternalLogAttributes({ source: 'job', message: timestamp.toString() }, LogLevel.info);
        log.timestamp = timestamp;
        storage.add(log);
      }
      expectLogsAreSorted(storage.fetch());
    });
  }

  it(`returns logs in the correct order (monkey testing)`, () => {
    const storage = LogStorage.create();
    fillLogs(storage, MAX_LIMIT);
    expectLogsAreSorted(storage.fetch());
  });
});

describe('query logs', () => {
  let storage: ILogStorage;

  beforeAll(() => {
    storage = LogStorage.create();
    storage.add(log1);
    storage.add(log2);
    storage.add(log3);
    fillLogs(storage, 10 * MAX_LIMIT);
  });

  it('returns a maximum of MAX_LIMIT records', () => {
    const records = storage.fetch();
    expect(records).toHaveLength(MAX_LIMIT);
    expectLogsAreSorted(records);
  });

  it('supports paging', () => {
    const records = storage.fetch({ skip: 3 });
    expect(records).toHaveLength(MAX_LIMIT);
    expect(records).not.toContain(log1);
    expect(records).not.toContain(log2);
    expect(records).not.toContain(log3);
  });

  it('supports time range filtering', () => {
    const records = storage.fetch({ from: 0, to: 99 });
    expect(records).toHaveLength(3);
    expect(records).toContain(log1);
    expect(records).toContain(log2);
    expect(records).toContain(log3);
  });

  const filters: { [key: string]: (log: InternalLogAttributes) => boolean } = {
    'level === "info"': (log) => log.level === LogLevel.info
  };
  for (const [filter, check] of Object.entries(filters)) {
    it(`supports expression filtering (${filter})`, () => {
      const records = storage.fetch({ filter: 'level === "info"' });
      expect(records.length).toBeGreaterThan(0);
      for (const record of records) {
        expect(check(record)).toBe(true);
      }
    });
  }
});
