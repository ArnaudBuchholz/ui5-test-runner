import { it, expect } from 'vitest';
import { LogStorage } from './LogStorage.js';
import { toInternalLogAttributes } from '../../platform/logger/toInternalLogAttributes.js';
import { LogLevel } from '../../platform/logger/types.js';

const log1 = toInternalLogAttributes({ source: 'job', message: '10' }, LogLevel.info);
log1.timestamp = 10;
const log2 = toInternalLogAttributes({ source: 'job', message: '20' }, LogLevel.info);
log2.timestamp = 20;
const log3 = toInternalLogAttributes({ source: 'job', message: '30' }, LogLevel.info);
log2.timestamp = 30;

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

for (const index in datasets) {
  const dataset = datasets[index]!;
  it.only(`returns logs in the correct order (datasets[${index}])`, () => {
    const storage = LogStorage.create();
    for (const timestamp of dataset) {
      const log = toInternalLogAttributes({ source: 'job', message: timestamp.toString() }, LogLevel.info);
      log.timestamp = timestamp;
      storage.add(log);
    }
    const logs = storage.fetch();
    let timestamp = 0;
    for (const log of logs) {
      expect(log.timestamp).toBeGreaterThanOrEqual(timestamp);
      timestamp = log.timestamp;
    }
  });
}
