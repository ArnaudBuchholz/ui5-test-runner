import { it, expect, vi, beforeEach } from 'vitest';
import { Npm } from '../Npm.js';
import { Process, logger } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import { factory } from './puppeteer.js';

const NO_CONFIGURATION = {} as Configuration;
const ABORT_SIGNAL = new AbortController().signal;

const npmImportSpy = vi.spyOn(Npm, 'import');

const makePage = () => ({
  evaluateOnNewDocument: vi.fn().mockResolvedValue(undefined),
  on: vi.fn().mockReturnThis(),
  authenticate: vi.fn().mockResolvedValue(undefined),
  goto: vi.fn().mockResolvedValue(undefined),
  evaluate: vi.fn().mockResolvedValue(undefined),
  screenshot: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined)
});

const makeBrowser = (page: ReturnType<typeof makePage>) => ({
  version: vi.fn().mockResolvedValue('120.0.0'),
  pages: vi.fn().mockResolvedValue([page]),
  newPage: vi.fn().mockResolvedValue(page),
  close: vi.fn().mockResolvedValue(undefined)
});

beforeEach(() => {
  vi.clearAllMocks();
  npmImportSpy.mockResolvedValue(undefined);
});

it('installs the browser and retries when launch throws "Could not find" error', async () => {
  const page = makePage();
  const browser = makeBrowser(page);
  const launch = vi
    .fn()
    .mockRejectedValueOnce(new Error('Could not find Chrome (ver. 120)'))
    .mockResolvedValueOnce(browser);
  npmImportSpy.mockResolvedValue({ launch });
  vi.mocked(Process.spawn).mockReturnValue({
    pid: 1,
    stdout: '',
    stderr: '',
    closed: Promise.resolve(),
    code: 0,
    kill: vi.fn()
  });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await instance.setup({});

  expect(Process.spawn).toHaveBeenCalledWith('npx', expect.arrayContaining(['puppeteer']), expect.any(Object));
  expect(launch).toHaveBeenCalledTimes(2);
  expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ source: 'progress' }));
});

it('rethrows when launch throws an error unrelated to missing browser', async () => {
  const launch = vi.fn().mockRejectedValue(new Error('permission denied'));
  npmImportSpy.mockResolvedValue({ launch });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await expect(instance.setup({})).rejects.toThrow('permission denied');
  expect(Process.spawn).not.toHaveBeenCalled();
});
