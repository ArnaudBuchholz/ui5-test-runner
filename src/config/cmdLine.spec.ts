import { it, expect } from 'vitest';
import { fromCmdLine } from './cmdLine.js';
import type { IJobConfig } from './Config.js';

it('copies cwd', () => {
  expect(fromCmdLine('/usr/test', [])).toStrictEqual<IJobConfig>({
    cwd: '/usr/test'
  });
});
