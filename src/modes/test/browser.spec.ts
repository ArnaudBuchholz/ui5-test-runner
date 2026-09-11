import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IBrowser, BrowserCapabilities } from '../../browsers/IBrowser.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { logger } from '../../platform/index.js';
import { __lastRegisteredExitAsyncTask } from '../../platform/mock.js';

vi.mock('../../browsers/factory.js', () => ({
  BrowserFactory: { build: vi.fn() }
}));

import { BrowserFactory } from '../../browsers/factory.js';

const CAPABILITIES: BrowserCapabilities = {
  browserName: 'chrome',
  browserVersion: '120',
  screenshotFormat: 'png'
};

const VIEWPORT = { width: 1920, height: 1080 };

const makeBrowser = (overrides: Partial<IBrowser> = {}): IBrowser => ({
  setup: vi.fn().mockResolvedValue(CAPABILITIES),
  newWindow: vi.fn().mockResolvedValue({ eval: vi.fn(), screenshot: vi.fn(), close: vi.fn() }),
  shutdown: vi.fn().mockResolvedValue(undefined),
  ...overrides
});

const makeConfig = (overrides: Partial<Configuration> = {}): Configuration =>
  ({
    browser: 'puppeteer',
    browserVisible: false,
    debugKeepBrowserOpen: false,
    browserViewportWidth: VIEWPORT.width,
    browserViewportHeight: VIEWPORT.height,
    ...overrides
  }) as unknown as Configuration;

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('setupBrowser', () => {
  it('passes the browser name to BrowserFactory.build', async () => {
    vi.mocked(BrowserFactory.build).mockResolvedValue(makeBrowser());
    const { setupBrowser } = await import('./browser.js');
    const config = makeConfig({ browser: 'puppeteer' });
    await setupBrowser(config);
    expect(BrowserFactory.build).toHaveBeenCalledWith(config, 'puppeteer');
  });

  it('builds BrowserSettings with visible=true when browserVisible is true', async () => {
    const browser = makeBrowser();
    vi.mocked(BrowserFactory.build).mockResolvedValue(browser);
    const { setupBrowser } = await import('./browser.js');
    await setupBrowser(makeConfig({ browserVisible: true, debugKeepBrowserOpen: false }));
    expect(browser.setup).toHaveBeenCalledWith(expect.objectContaining({ visible: true, viewport: VIEWPORT }));
  });

  it('builds BrowserSettings with visible=true when debugKeepBrowserOpen is true', async () => {
    const browser = makeBrowser();
    vi.mocked(BrowserFactory.build).mockResolvedValue(browser);
    const { setupBrowser } = await import('./browser.js');
    await setupBrowser(makeConfig({ browserVisible: false, debugKeepBrowserOpen: true }));
    expect(browser.setup).toHaveBeenCalledWith(expect.objectContaining({ visible: true }));
  });

  it('calls logger.fatal with Unable to setup browser when browser.setup rejects', async () => {
    const browser = makeBrowser({ setup: vi.fn().mockRejectedValue(new Error('fail')) });
    vi.mocked(BrowserFactory.build).mockResolvedValue(browser);
    const { setupBrowser } = await import('./browser.js');
    // logger.fatal throws ExitShutdownError
    await expect(setupBrowser(makeConfig())).rejects.toThrow();
    expect(logger.fatal).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unable to setup browser' }));
  });

  it('returns capabilities from browser.setup', async () => {
    vi.mocked(BrowserFactory.build).mockResolvedValue(makeBrowser());
    const { setupBrowser } = await import('./browser.js');
    const result = await setupBrowser(makeConfig());
    expect(result).toBe(CAPABILITIES);
  });

  describe('debugKeepBrowserOpen wrapping', () => {
    it('registers an Exit async task named debugKeepBrowserOpen', async () => {
      vi.mocked(BrowserFactory.build).mockResolvedValue(makeBrowser());
      const { setupBrowser } = await import('./browser.js');
      await setupBrowser(makeConfig({ debugKeepBrowserOpen: true }));
      expect(__lastRegisteredExitAsyncTask.name).toBe('debugKeepBrowserOpen');
    });

    it('makes window.close a no-op', async () => {
      const originalClose = vi.fn().mockResolvedValue(undefined);
      const window = { eval: vi.fn(), screenshot: vi.fn(), close: originalClose };
      const browser = makeBrowser({ newWindow: vi.fn().mockResolvedValue(window) });
      vi.mocked(BrowserFactory.build).mockResolvedValue(browser);
      const { setupBrowser, getBrowser } = await import('./browser.js');
      await setupBrowser(makeConfig({ debugKeepBrowserOpen: true }));
      const wrappedWindow = await getBrowser().newWindow({ pageId: 1, scripts: [], url: 'https://x' });
      await wrappedWindow.close();
      expect(originalClose).not.toHaveBeenCalled();
    });

    it('shutdown logs warn before resolving', async () => {
      vi.mocked(BrowserFactory.build).mockResolvedValue(makeBrowser());
      const { setupBrowser, getBrowser } = await import('./browser.js');
      await setupBrowser(makeConfig({ debugKeepBrowserOpen: true }));
      // Start shutdown (never resolves until stop is called) — we only assert the immediate side-effect
      void __lastRegisteredExitAsyncTask.stop();
      await getBrowser().shutdown();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Browser will remain open, use CTRL+C to end command' })
      );
    });

    it('resolves shutdown when Exit task is stopped', async () => {
      vi.mocked(BrowserFactory.build).mockResolvedValue(makeBrowser());
      const { setupBrowser, getBrowser } = await import('./browser.js');
      await setupBrowser(makeConfig({ debugKeepBrowserOpen: true }));
      const shutdownPromise = getBrowser().shutdown();
      void __lastRegisteredExitAsyncTask.stop();
      await expect(shutdownPromise).resolves.toBeUndefined();
    });
  });
});

describe('getBrowser', () => {
  it('returns the browser stored after setupBrowser', async () => {
    const browser = makeBrowser();
    vi.mocked(BrowserFactory.build).mockResolvedValue(browser);
    const { setupBrowser, getBrowser } = await import('./browser.js');
    await setupBrowser(makeConfig());
    expect(getBrowser()).toBe(browser);
  });
});

describe('getBrowserCapabilities', () => {
  it('returns the capabilities stored after setupBrowser', async () => {
    vi.mocked(BrowserFactory.build).mockResolvedValue(makeBrowser());
    const { setupBrowser, getBrowserCapabilities } = await import('./browser.js');
    await setupBrowser(makeConfig());
    expect(getBrowserCapabilities()).toBe(CAPABILITIES);
  });
});
