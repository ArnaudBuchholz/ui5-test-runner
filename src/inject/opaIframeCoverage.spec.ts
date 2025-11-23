import { it, expect, beforeEach, vi } from 'vitest';
import { UI5_TEST_RUNNER } from './contants.js';

const defineProperty = vi.spyOn(Object, 'defineProperty');

beforeEach(() => vi.resetModules());

it.skip('does nothing on the main window', async () => {
  await import('./opaIframeCoverage.js');
  expect(defineProperty).toHaveBeenCalledTimes(1);
  expect(defineProperty).toHaveBeenCalledWith(window, `${UI5_TEST_RUNNER}/opa-iframe-coverage`, {
    value: true
  });
});
