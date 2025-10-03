import { it, expect } from 'vitest';
import { fromCmdLine } from './cmdLine.js';
import type { IJobConfig } from '../interfaces/IJobConfig.js';

it('dumps cwd', () => {
  expect(fromCmdLine('/usr/test', [])).toStrictEqual<IJobConfig>({
    cwd: '/usr/test'
  });
});
