import { it, expect, vi, beforeEach } from 'vitest';
import { FileSystem } from '../platform/index.js';
import { Npm } from '../Npm.js';
import { version } from './version.js';

const PACKAGE_JSON = JSON.stringify({ name: 'ui5-test-runner', version: '1.2.3' });

beforeEach(() => {
  vi.mocked(FileSystem.readFile).mockResolvedValue(PACKAGE_JSON);
});

it('logs name@version when already on latest', async () => {
  vi.spyOn(Npm, 'getLatestVersion').mockResolvedValue('1.2.3');
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  await version();
  expect(log).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalledWith('ui5-test-runner@1.2.3');
  log.mockRestore();
});

it('logs an update notice when a newer version is available', async () => {
  vi.spyOn(Npm, 'getLatestVersion').mockResolvedValue('2.0.0');
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  await version();
  expect(log).toHaveBeenCalledTimes(2);
  expect(log).toHaveBeenNthCalledWith(1, 'ui5-test-runner@1.2.3');
  expect(log).toHaveBeenNthCalledWith(2, 'Latest version of ui5-test-runner is 2.0.0');
  log.mockRestore();
});
