import { it, expect, vi, beforeEach } from 'vitest';
import { Npm } from '../Npm.js';
import { Process, logger } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import { factory } from './puppeteer.js';
import { RecoverableBrowserError } from './RecoverableBrowserError.js';

const NO_CONFIGURATION = {} as Configuration;
const ABORT_SIGNAL = new AbortController().signal;

const npmImportSpy = vi.spyOn(Npm, 'import');

const makePage = () => ({
  evaluateOnNewDocument: vi.fn().mockResolvedValue(undefined),
  on: vi.fn().mockReturnThis(),
  authenticate: vi.fn().mockResolvedValue(undefined),
  emulate: vi.fn().mockResolvedValue(undefined),
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

it('emulates the requested known device before navigating', async () => {
  const page = makePage();
  const browser = makeBrowser(page);
  const device = { viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, userAgent: 'iPhone' };
  npmImportSpy.mockResolvedValue({ launch: vi.fn().mockResolvedValue(browser), KnownDevices: { 'iPhone X': device } });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await instance.setup({ device: 'iPhone X' });
  await instance.newWindow({ pageId: 1, scripts: [], url: 'https://example.test' });

  expect(page.emulate).toHaveBeenCalledWith(device);
  expect(page.emulate).toHaveBeenCalledBefore(page.goto);
});

it('rejects an unknown device name and lists the available devices', async () => {
  const page = makePage();
  const browser = makeBrowser(page);
  npmImportSpy.mockResolvedValue({ launch: vi.fn().mockResolvedValue(browser), KnownDevices: { 'iPhone X': {} } });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await instance.setup({ device: 'no-such-device' });

  await expect(instance.newWindow({ pageId: 1, scripts: [], url: 'https://example.test' })).rejects.toThrow(
    'Unknown device "no-such-device", available devices: iPhone X'
  );
  await expect(instance.newWindow({ pageId: 1, scripts: [], url: 'https://example.test' })).rejects.toBeInstanceOf(
    RecoverableBrowserError
  );
  expect(page.goto).not.toHaveBeenCalled();
});

it('forwards ignoreDefaultArgs: true from browserOptions to launch', async () => {
  const page = makePage();
  const browser = makeBrowser(page);
  const launch = vi.fn().mockResolvedValue(browser);
  npmImportSpy.mockResolvedValue({ launch });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await instance.setup({ options: { ignoreDefaultArgs: true } });

  expect(launch).toHaveBeenCalledWith(expect.objectContaining({ ignoreDefaultArgs: true }));
});

it('forwards ignoreDefaultArgs array from browserOptions to launch', async () => {
  const page = makePage();
  const browser = makeBrowser(page);
  const launch = vi.fn().mockResolvedValue(browser);
  npmImportSpy.mockResolvedValue({ launch });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await instance.setup({ options: { ignoreDefaultArgs: ['--enable-automation'] } });

  expect(launch).toHaveBeenCalledWith(
    expect.objectContaining({ ignoreDefaultArgs: ['--enable-automation'] })
  );
});

it('omits ignoreDefaultArgs from launch when not set in browserOptions', async () => {
  const page = makePage();
  const browser = makeBrowser(page);
  const launch = vi.fn().mockResolvedValue(browser);
  npmImportSpy.mockResolvedValue({ launch });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await instance.setup({});

  expect(launch).toHaveBeenCalledWith(expect.not.objectContaining({ ignoreDefaultArgs: expect.anything() }));
});
