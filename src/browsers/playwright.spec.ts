import { it, expect, vi, beforeEach } from 'vitest';
import { Npm } from '../Npm.js';
import { Process, logger } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import { factory } from './playwright.js';

const NO_CONFIGURATION = {} as Configuration;
const ABORT_SIGNAL = new AbortController().signal;

const npmImportSpy = vi.spyOn(Npm, 'import');

const makeContext = () => ({
  pages: vi.fn().mockReturnValue([]),
  newPage: vi.fn().mockResolvedValue({
    addInitScript: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockReturnThis(),
    goto: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined)
  })
});

const makeBrowser = (context: ReturnType<typeof makeContext>) => ({
  browserType: vi.fn().mockReturnValue({ name: vi.fn().mockReturnValue('chromium') }),
  version: vi.fn().mockReturnValue('120.0'),
  newContext: vi.fn().mockResolvedValue(context),
  close: vi.fn().mockResolvedValue(undefined)
});

beforeEach(() => {
  vi.clearAllMocks();
  npmImportSpy.mockResolvedValue(undefined);
});

it('installs chromium and retries when launch throws "Executable doesn\'t" error', async () => {
  const context = makeContext();
  const browser = makeBrowser(context);
  const chromium = {
    launch: vi.fn().mockRejectedValueOnce(new Error("Executable doesn't exist")).mockResolvedValueOnce(browser)
  };
  npmImportSpy.mockResolvedValue({ chromium });
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

  expect(Process.spawn).toHaveBeenCalledWith('npx', expect.arrayContaining(['playwright']), expect.any(Object));
  expect(chromium.launch).toHaveBeenCalledTimes(2);
  expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ source: 'progress' }));
});

it('rethrows when launch throws an error unrelated to missing executable', async () => {
  const chromium = {
    launch: vi.fn().mockRejectedValue(new Error('some other error'))
  };
  npmImportSpy.mockResolvedValue({ chromium });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await expect(instance.setup({})).rejects.toThrow('some other error');
  expect(Process.spawn).not.toHaveBeenCalled();
});

it('forwards ignoreDefaultArgs: true from browserOptions to launch', async () => {
  const context = makeContext();
  const browser = makeBrowser(context);
  const chromium = { launch: vi.fn().mockResolvedValue(browser) };
  npmImportSpy.mockResolvedValue({ chromium });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await instance.setup({ options: { ignoreDefaultArgs: true } });

  expect(chromium.launch).toHaveBeenCalledWith(expect.objectContaining({ ignoreDefaultArgs: true }));
});

it('forwards ignoreDefaultArgs array from browserOptions to launch', async () => {
  const context = makeContext();
  const browser = makeBrowser(context);
  const chromium = { launch: vi.fn().mockResolvedValue(browser) };
  npmImportSpy.mockResolvedValue({ chromium });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await instance.setup({ options: { ignoreDefaultArgs: ['--enable-automation'] } });

  expect(chromium.launch).toHaveBeenCalledWith(expect.objectContaining({ ignoreDefaultArgs: ['--enable-automation'] }));
});

it('omits ignoreDefaultArgs from launch when not set in browserOptions', async () => {
  const context = makeContext();
  const browser = makeBrowser(context);
  const chromium = { launch: vi.fn().mockResolvedValue(browser) };
  npmImportSpy.mockResolvedValue({ chromium });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await instance.setup({});

  expect(chromium.launch).toHaveBeenCalledWith(
    expect.not.objectContaining({ ignoreDefaultArgs: expect.anything() as unknown })
  );
});

it('forwards args from browserOptions to launch', async () => {
  const context = makeContext();
  const browser = makeBrowser(context);
  const chromium = { launch: vi.fn().mockResolvedValue(browser) };
  npmImportSpy.mockResolvedValue({ chromium });

  const instance = await factory(NO_CONFIGURATION, ABORT_SIGNAL);
  await instance.setup({ options: { args: ['--no-sandbox'] } });

  expect(chromium.launch).toHaveBeenCalledWith(
    expect.objectContaining({ args: expect.arrayContaining(['--no-sandbox']) as string[] })
  );
});
