import { it, expect } from 'vitest';
import { ProgressBar } from './ProgressBar.js';
import { LogLevel } from '../logger/types.js';

const tests: { label: string; logs: object[]; width?: number; expected: string }[] = [
  {
    label: '0%',
    logs: [
      {
        level: LogLevel.info,
        source: 'progress',
        message: 'test',
        data: {
          value: 0,
          max: 100
        }
      }
    ],
    expected: '[----------]  0% test'
  },
  {
    label: '50%',
    logs: [
      {
        level: LogLevel.info,
        source: 'progress',
        message: 'test',
        data: {
          value: 50,
          max: 100
        }
      }
    ],
    expected: '[#####-----] 50% test'
  },
  {
    label: '100%',
    logs: [
      {
        level: LogLevel.info,
        source: 'progress',
        message: 'test',
        data: {
          value: 100,
          max: 100
        }
      }
    ],
    expected: '[##########]100% test'
  },
  {
    label: 'truncates label',
    logs: [
      {
        level: LogLevel.info,
        source: 'progress',
        message: 'very long label',
        data: {
          value: 10,
          max: 100
        }
      }
    ],
    width: 25,
    expected: '[#---------] 10% ...label'
  }
] as const;

for (const { label, logs, expected, width = 80 } of tests) {
  it(label, () => {
    const pb = new ProgressBar();
    for (const log of logs) {
      pb.update(log as Parameters<typeof ProgressBar.prototype.update>[0]);
    }
    const rendered = pb.render(width);
    expect(rendered.length).toBeLessThanOrEqual(width);
    expect(rendered).toStrictEqual(expected);
  });
}
