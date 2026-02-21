import { it, expect } from 'vitest';
import { UI5_TEST_RUNNER } from './contants.js';
import './index.js';

it('defines agent properties (state)', () => {
  expect(window[UI5_TEST_RUNNER].state).not.toBeUndefined();
});

it('defines agent properties (report)', () => {
  expect(window[UI5_TEST_RUNNER].results).not.toBeUndefined();
});
