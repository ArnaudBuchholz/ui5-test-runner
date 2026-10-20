import { it, expect } from 'vitest';
import { UI5_TEST_RUNNER } from './contants.js';
import { getConfig } from './config.js';
import type { Configuration } from './Configuration.js';

it('returns the config object from the global window namespace', () => {
  const fakeConfig = { pageId: 42 } as unknown as Configuration;
  window[UI5_TEST_RUNNER] = { ...window[UI5_TEST_RUNNER], config: fakeConfig };
  expect(getConfig()).toBe(fakeConfig);
});
