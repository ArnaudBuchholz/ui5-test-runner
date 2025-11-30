import { it, expect } from 'vitest';
import { ProgressBar } from './ProgressBar.js';
import type { InternalLogAttributes, LogAttributes } from '../loggerTypes.js';
import { LogLevel } from '../loggerTypes.js';

it('renders a progress bar', () => {
  const pb = new ProgressBar('1');
  pb.update({
    level: LogLevel.info,
    source: 'progress',
    message: 'test',
    data: {
      uid: '1',
      value: 50,
      max: 100
    }
  } as unknown as InternalLogAttributes & LogAttributes);
  expect(pb.render(80)).toStrictEqual('█████░░░░░ 50% test');
});
