import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserFactory } from './factory.js';
import type { Browser } from './factory.js';
import type { IBrowser } from './IBrowser.js';
import { defaults } from '../configuration/options.js';
import type { Configuration } from '../configuration/Configuration.js';
import { logger } from '../platform/index.js';
import { Npm } from '../Npm.js';

const mockNpmImport = vi.spyOn(Npm, 'import');

type TTestBrowserArguments = {
  name: Browser;
  failedSetupTestCases?: {
    label: string;
    setup: () => void | Promise<void>;
  }[];
};

beforeEach(() => vi.clearAllMocks());

export const testBrowser = ({ name, failedSetupTestCases }: TTestBrowserArguments) => {
  const BASE_URL = process.env['BROWSERS_SERVER_URL'] ?? '';
  const FACTORY_SETTINGS = {
    ...defaults,
    coverageReporters: [],
    mode: 'help',
    sources: {}
  } as const as Configuration;
  const BROWSER_SETTINGS = {} as const;

  describe('initialization failures', () => {
    it('fails with fatal when not able to load module', async () => {
      const error = new Error('Unable to load module');
      mockNpmImport.mockRejectedValueOnce(error);
      await expect(BrowserFactory.build(FACTORY_SETTINGS, name)).rejects.toThrow();
      expect(logger.fatal).toHaveBeenCalledWith({
        source: name,
        message: 'Unable to initialize',
        error,
        data: FACTORY_SETTINGS
      });
    });
  });

  describe('initialization succeeds', () => {
    let browser: IBrowser;

    if (failedSetupTestCases) {
      describe('setup failures', () => {
        for (const { label, setup } of failedSetupTestCases)
          it(`fails with fatal when ${label}`, async () => {
            await setup();
            const browser = await BrowserFactory.build(FACTORY_SETTINGS, name);
            await expect(browser.setup(BROWSER_SETTINGS)).rejects.toThrow();
            expect(logger.fatal).toHaveBeenCalledWith({
              source: name,
              message: 'Unable to setup',
              error: expect.any(Error) as Error,
              data: { factory: FACTORY_SETTINGS, settings: BROWSER_SETTINGS }
            });
          });
      });
    }

    describe('setup succeeds', () => {
      beforeEach(async () => {
        browser = await BrowserFactory.build(FACTORY_SETTINGS, name);
        await browser.setup(BROWSER_SETTINGS);
      });

      afterEach(() => browser.shutdown());

      it('documented the setup', () => {
        expect(logger.debug).toHaveBeenCalledWith({ source: name, message: 'setup', data: BROWSER_SETTINGS });
        expect(logger.debug).toHaveBeenCalledWith({
          source: name,
          message: 'setup completed',
          data: {
            browserName: expect.any(String) as string,
            browserVersion: expect.any(String) as string,
            screenshotFormat: expect.any(String) as string
          }
        });
      });

      it('enable and document the creation of a window', async () => {
        const settings = {
          pageId: 0,
          scripts: [],
          url: BASE_URL
        } as const;
        const window = await browser.newWindow(settings);
        expect(window).toBeDefined();
        expect(logger.debug).toHaveBeenCalledWith({ source: name, message: 'newWindow', pageId: 0, data: settings });
        expect(logger.debug).toHaveBeenCalledWith({
          source: name,
          message: 'newWindow completed',
          pageId: 0,
          data: settings
        });
      });

      it('enable and document the closing of a window', async () => {
        const window = await browser.newWindow({
          pageId: 0,
          scripts: [],
          url: BASE_URL
        });
        await window.close();
        expect(logger.debug).toHaveBeenCalledWith({ source: name, message: 'window closed', pageId: 0 });
      });


      it.skip('supports multiple windows');
      it.skip('registers an async task');
      it.skip('stops the browser on shutdown');

      it.skip('captures console logs');
      it.skip('captures agent logs');
      it.skip('captures network logs');

      it.skip('enables eval');
      it.skip('enables screenshots');
    });
  });
};
