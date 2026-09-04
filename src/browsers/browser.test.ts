import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { BrowserFactory } from './factory.js';
import type { Browser } from './factory.js';
import type { IBrowser } from './IBrowser.js';
import { defaults } from '../configuration/options.js';
import { Configuration } from '../configuration/Configuration.js';
import { logger } from '../platform/index.js';
import { Npm } from '../Npm.js';

const mockNpmImport = vi.spyOn(Npm, 'import');

type TTestBrowserArgs = {
  name: Browser,
  failedInitTestCases?: {
    label: string;
    moduleMock: unknown;
  }[];
};

export const testBrowser = ({
  name,
  failedInitTestCases,
}: TTestBrowserArgs) => {
  const BASE_URL = process.env['BROWSERS_SERVER_URL'] ?? '';
  const SETTINGS = {
      ...defaults,
      coverageReporters: [],
      mode: 'help',
      sources: {}
    } as Configuration;

  describe.only('initialization failures', () => {
    it('fails with fatal when not able to load module', async () => {
      const error = new Error('Unable to load module');
      mockNpmImport.mockRejectedValueOnce(error);
      await expect(BrowserFactory.build(SETTINGS, name)).rejects.toThrow();
      expect(logger.fatal).toHaveBeenCalledWith({ source: name, message: 'Unable to initialize', error, data: SETTINGS });
    });

    failedInitTestCases?.forEach(({ label, moduleMock}) =>
      it(`fails with fatal when ${label}`, async () => {
        mockNpmImport.mockResolvedValueOnce(moduleMock);
        await expect(BrowserFactory.build(SETTINGS, name)).rejects.toThrow();
        expect(logger.fatal).toHaveBeenCalledWith({ source: name, message: 'Unable to initialize', error, data: SETTINGS });
      })
    );
  });

  describe('initialization works', () => {
    let browser: IBrowser;

    beforeAll(async () => {
      browser = await BrowserFactory.build(SETTINGS, name);
      await browser.setup({});
    });

    afterAll(() => browser.shutdown());

    it('documented the setup', () => {
      expect(logger.debug).toHaveBeenCalledWith({ source: name, message: 'setup', data: SETTINGS });
      expect(logger.debug).toHaveBeenCalledWith({ source: name, message: 'setup completed', data: SETTINGS });
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
      expect(logger.debug).toHaveBeenCalledWith({ source: name, message: 'newWindow completed', pageId: 0, data: settings });
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
  });
}