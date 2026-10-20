import { it, expect, vi, beforeEach } from 'vitest';
import { Npm } from '../Npm.js';
import { logger } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import { factory } from './webdriverio.js';
import * as networkResponse from './networkResponse.js';

const NO_CONFIGURATION = { reportDir: '/test/report' } as unknown as Configuration;

const npmImportSpy = vi.spyOn(Npm, 'import');

type NetworkResponseStartedListener = (entry: unknown) => void;

const makeRemoteBrowser = () => {
  const listeners: Record<string, NetworkResponseStartedListener[]> = {};
  return {
    capabilities: { browserName: 'chrome', browserVersion: '120' },
    on: vi.fn((event: string, listener: NetworkResponseStartedListener) => {
      listeners[event] ??= [];
      listeners[event].push(listener);
    }),
    off: vi.fn(),
    sessionSubscribe: vi.fn().mockResolvedValue(undefined),
    emit: (event: string, data: unknown) => {
      const eventListeners = listeners[event] ?? [];
      for (const l of eventListeners) l(data);
    },
    getWindowHandle: vi.fn().mockResolvedValue('handle-1'),
    getWindowHandles: vi.fn().mockResolvedValue(['handle-1']),
    switchToWindow: vi.fn().mockResolvedValue(undefined),
    browsingContextCreate: vi.fn().mockResolvedValue({ context: 'ctx-1' }),
    browsingContextClose: vi.fn().mockResolvedValue(undefined),
    browsingContextNavigate: vi.fn().mockResolvedValue(undefined),
    scriptAddPreloadScript: vi.fn().mockResolvedValue(undefined),
    url: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue(undefined),
    saveScreenshot: vi.fn().mockResolvedValue(undefined),
    deleteSession: vi.fn().mockResolvedValue(undefined)
  };
};

const handleNetworkResponseSpy = vi.spyOn(networkResponse, 'handleNetworkResponse').mockReturnValue(undefined);

beforeEach(() => {
  vi.clearAllMocks();
  npmImportSpy.mockResolvedValue(undefined);
  handleNetworkResponseSpy.mockReturnValue(undefined);
});

it('falls back to pageId -1 when network.responseStarted event has context: null', async () => {
  const remoteBrowser = makeRemoteBrowser();
  npmImportSpy.mockResolvedValue({ remote: vi.fn().mockResolvedValue(remoteBrowser) });
  const browser = await factory(NO_CONFIGURATION);
  await browser.setup({});
  remoteBrowser.emit('network.responseStarted', {
    context: null,
    request: { url: 'https://example.com', method: 'GET', headers: [] },
    response: { status: 200, headers: [] }
  });
  expect(handleNetworkResponseSpy).toHaveBeenCalledWith(-1, 'https://example.com', 'GET', 200, {}, {});
  expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ source: 'webdriverio' }));
});
