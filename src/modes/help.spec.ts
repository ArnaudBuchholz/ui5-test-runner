import { it, expect, vi } from 'vitest';
import { help } from './help.js';

it('logs the documentation URL', () => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  help();
  expect(log).toHaveBeenCalledWith('Please check https://arnaudbuchholz.github.io/ui5-test-runner/');
  log.mockRestore();
});
