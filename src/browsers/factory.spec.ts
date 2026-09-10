import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserFactory } from './factory.js';
import type { IBrowser, IWindow, BrowserCapabilities } from './IBrowser.js';
import { defaults } from '../configuration/options.js';
import type { Configuration } from '../configuration/Configuration.js';
import { Exit } from '../platform/Exit.js';
import { logger } from '../platform/index.js';
import { __unregisterExitAsyncTask, __lastRegisteredExitAsyncTask } from '../platform/mock.js';

vi.mock(import('./puppeteer.js'), () => ({
  factory: vi.fn()
}));

import { factory as mockPuppeteerFactory } from './puppeteer.js';

const FACTORY_SETTINGS = {
  ...defaults,
  coverageReporters: [],
  mode: 'legacy',
  sources: {}
} as const as Configuration;

const BROWSER_SETTINGS = {} as const;

const WINDOW_SETTINGS = { pageId: 42, scripts: [], url: 'https://example.com' } as const;

const CAPABILITIES: BrowserCapabilities = {
  screenshotFormat: '.png',
  browserName: 'mock',
  browserVersion: '1.0'
};

const makeInnerWindow = (): IWindow => ({
  eval: vi.fn().mockResolvedValue(undefined),
  screenshot: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined)
});

const makeInnerBrowser = (): IBrowser => ({
  setup: vi.fn().mockResolvedValue(CAPABILITIES),
  newWindow: vi.fn().mockResolvedValue(makeInnerWindow()),
  shutdown: vi.fn().mockResolvedValue(undefined)
});

beforeEach(() => vi.clearAllMocks());

describe('BrowserFactory', () => {
  describe('build', () => {
    it('passes an abort signal to the inner factory', async () => {
      const inner = makeInnerBrowser();
      vi.mocked(mockPuppeteerFactory).mockResolvedValue(inner);
      await BrowserFactory.build(FACTORY_SETTINGS, 'puppeteer');
      expect(mockPuppeteerFactory).toHaveBeenCalledWith(FACTORY_SETTINGS, expect.any(AbortSignal) as AbortSignal);
    });
  });

  describe('setup', () => {
    it('registers an async task named after the browser with an incrementing index', async () => {
      const inner = makeInnerBrowser();
      vi.mocked(mockPuppeteerFactory).mockResolvedValue(inner);
      const browser = await BrowserFactory.build(FACTORY_SETTINGS, 'puppeteer');
      await browser.setup(BROWSER_SETTINGS);
      expect(Exit.registerAsyncTask).toHaveBeenCalledOnce();
      expect(__lastRegisteredExitAsyncTask.name).toMatch(/^puppeteer#\d+$/);
    });

    it('logs fatal, disposes the task and rethrows when setup fails', async () => {
      const error = new Error('setup failed');
      const inner = makeInnerBrowser();
      vi.mocked(inner.setup).mockRejectedValueOnce(error);
      vi.mocked(mockPuppeteerFactory).mockResolvedValue(inner);
      const browser = await BrowserFactory.build(FACTORY_SETTINGS, 'puppeteer');
      await expect(browser.setup(BROWSER_SETTINGS)).rejects.toThrow();
      expect(logger.fatal).toHaveBeenCalledWith({
        source: 'puppeteer',
        message: 'setup failed',
        error
      });
      expect(__unregisterExitAsyncTask).toHaveBeenCalledOnce();
    });

    it('logs setup and setup completed', async () => {
      const inner = makeInnerBrowser();
      vi.mocked(mockPuppeteerFactory).mockResolvedValue(inner);
      const browser = await BrowserFactory.build(FACTORY_SETTINGS, 'puppeteer');
      await browser.setup(BROWSER_SETTINGS);
      expect(logger.debug).toHaveBeenCalledWith({ source: 'puppeteer', message: 'setup', data: BROWSER_SETTINGS });
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'puppeteer',
        message: 'setup completed',
        data: CAPABILITIES
      });
    });
  });

  describe('newWindow', () => {
    it('logs newWindow and newWindow completed', async () => {
      const inner = makeInnerBrowser();
      vi.mocked(mockPuppeteerFactory).mockResolvedValue(inner);
      const browser = await BrowserFactory.build(FACTORY_SETTINGS, 'puppeteer');
      await browser.setup(BROWSER_SETTINGS);
      await browser.newWindow(WINDOW_SETTINGS);
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'puppeteer',
        message: 'newWindow',
        pageId: 42,
        data: WINDOW_SETTINGS
      });
      expect(logger.debug).toHaveBeenCalledWith({
        source: 'puppeteer',
        message: 'newWindow completed',
        pageId: 42
      });
    });

    it('logs fatal when newWindow fails', async () => {
      const error = new Error('newWindow error');
      const inner = makeInnerBrowser();
      vi.mocked(inner.newWindow).mockRejectedValueOnce(error);
      vi.mocked(mockPuppeteerFactory).mockResolvedValue(inner);
      const browser = await BrowserFactory.build(FACTORY_SETTINGS, 'puppeteer');
      await browser.setup(BROWSER_SETTINGS);
      await expect(browser.newWindow(WINDOW_SETTINGS)).rejects.toThrow();
      expect(logger.fatal).toHaveBeenCalledWith({
        source: 'puppeteer',
        message: 'newWindow failed',
        error
      });
    });

    describe('window wrapper', () => {
      let innerWindow: IWindow;
      let window: IWindow;

      beforeEach(async () => {
        const inner = makeInnerBrowser();
        vi.mocked(mockPuppeteerFactory).mockResolvedValue(inner);
        const browser = await BrowserFactory.build(FACTORY_SETTINGS, 'puppeteer');
        await browser.setup(BROWSER_SETTINGS);
        innerWindow = makeInnerWindow();
        vi.mocked(inner.newWindow).mockResolvedValue(innerWindow);
        window = await browser.newWindow(WINDOW_SETTINGS);
      });

      it('wraps the returned window so eval logs eval and eval completed', async () => {
        vi.mocked(innerWindow.eval).mockResolvedValue(2);
        const result = await window.eval('1 + 1');
        expect(result).toStrictEqual(2);
        expect(logger.debug).toHaveBeenCalledWith({
          source: 'puppeteer',
          message: 'eval',
          pageId: 42,
          data: { script: '1 + 1' }
        });
        expect(logger.debug).toHaveBeenCalledWith({
          source: 'puppeteer',
          message: 'eval completed',
          pageId: 42,
          data: { result }
        });
      });

      it('logs eval failed and rethrows when eval throws', async () => {
        const error = new Error('eval error');
        vi.mocked(innerWindow.eval).mockRejectedValueOnce(error);
        await expect(window.eval('bad')).rejects.toThrow(error);
        expect(logger.error).toHaveBeenCalledWith({
          source: 'puppeteer',
          message: 'eval failed',
          pageId: 42,
          error
        });
      });

      it('wraps the returned window so screenshot logs screenshot and screenshot completed', async () => {
        await window.screenshot('/tmp/test.png');
        expect(logger.debug).toHaveBeenCalledWith({
          source: 'puppeteer',
          message: 'screenshot',
          pageId: 42,
          data: { path: '/tmp/test.png' }
        });
        expect(logger.debug).toHaveBeenCalledWith({
          source: 'puppeteer',
          message: 'screenshot completed',
          pageId: 42,
          data: { path: '/tmp/test.png' }
        });
      });

      it('logs screenshot failed and rethrows when screenshot throws', async () => {
        const error = new Error('screenshot error');
        vi.mocked(innerWindow.screenshot).mockRejectedValueOnce(error);
        await expect(window.screenshot('/tmp/bad.png')).rejects.toThrow(error);
        expect(logger.error).toHaveBeenCalledWith({
          source: 'puppeteer',
          message: 'screenshot failed',
          pageId: 42,
          error,
          data: { path: '/tmp/bad.png' }
        });
      });

      it('logs window close and window closed', async () => {
        await window.close();
        expect(logger.debug).toHaveBeenCalledWith({ source: 'puppeteer', message: 'window close', pageId: 42 });
        expect(logger.debug).toHaveBeenCalledWith({ source: 'puppeteer', message: 'window closed', pageId: 42 });
      });

      it('logs page.close failed and continues when close throws', async () => {
        const error = new Error('close error');
        vi.mocked(innerWindow.close).mockRejectedValueOnce(error);
        await window.close(); // No error
        expect(logger.error).toHaveBeenCalledWith({ source: 'puppeteer', message: 'window close failed', error });
      });
    });
  });

  describe('shutdown', () => {
    it('calls inner shutdown and disposes the task', async () => {
      const inner = makeInnerBrowser();
      vi.mocked(mockPuppeteerFactory).mockResolvedValue(inner);
      const browser = await BrowserFactory.build(FACTORY_SETTINGS, 'puppeteer');
      await browser.setup(BROWSER_SETTINGS);
      await browser.shutdown();
      expect(inner.shutdown).toHaveBeenCalledOnce();
      expect(__unregisterExitAsyncTask).toHaveBeenCalledOnce();
    });

    it('aborts the signal and calls inner shutdown when Exit fires stop', async () => {
      const inner = makeInnerBrowser();
      vi.mocked(mockPuppeteerFactory).mockResolvedValue(inner);
      const browser = await BrowserFactory.build(FACTORY_SETTINGS, 'puppeteer');
      await browser.setup(BROWSER_SETTINGS);
      await __lastRegisteredExitAsyncTask.stop();
      const [, signal] = vi.mocked(mockPuppeteerFactory).mock.calls[0]!;
      expect(signal.aborted).toBe(true);
      expect(inner.shutdown).toHaveBeenCalledOnce();
    });
  });
});
