import { it, expect, vi } from 'vitest';
import { dumpConfig } from './dumpConfig.js';
import type { Configuration } from '../configuration/Configuration.js';

const NO_CONFIGURATION = {} as Configuration;

it('logs the configuration as formatted JSON', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  dumpConfig(NO_CONFIGURATION);
  expect(log).toHaveBeenCalledWith(JSON.stringify(NO_CONFIGURATION, null, 2));
  log.mockRestore();
});
