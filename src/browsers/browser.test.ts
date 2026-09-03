import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { BrowserFactory } from './factory.js';
import type { Browser } from './factory.js';
import type { IBrowser } from './IBrowser.js';
import { defaults } from '../configuration/options.js';
import { Configuration } from '../configuration/Configuration.js';
import { logger } from '../platform/index.js';

export const testIBrowser = (browserName: Browser) => {
  const BASE_URL = process.env['BROWSERS_SERVER_URL'] ?? '';
  const SETTINGS = {
      ...defaults,
      coverageReporters: [],
      mode: 'help',
      sources: {}
    } as Configuration;

  describe('', () => {

  });

  describe('')

  let browser: IBrowser;

  beforeAll(async () => {
    browser = await BrowserFactory.build(SETTINGS, browserName);
    await browser.setup({});
  });

  afterAll(() => browser.shutdown());

  it('documented the setup', () => {
    expect(logger.debug).toHaveBeenCalledWith({ source: browserName, message: 'setup', data: SETTINGS });
    expect(logger.debug).toHaveBeenCalledWith({ source: browserName, message: 'setup completed', data: SETTINGS });
  });

  it('enable and document the creation of a window', async () => {
    const settings = {
      pageId: 0,
      scripts: [],
      url: BASE_URL
    } as const;
    const window = await browser.newWindow(settings);
    expect(window).toBeDefined();
    expect(logger.debug).toHaveBeenCalledWith({ source: browserName, message: 'newWindow', data: settings });
    expect(logger.debug).toHaveBeenCalledWith({ source: browserName, message: 'newWindow completed', data: settings });
  });

  it('enable and document the closing of a window', async () => {
    const window = await browser.newWindow({
      pageId: 0,
      scripts: [],
      url: BASE_URL
    });
    await window.close();
    expect(logger.debug).toHaveBeenCalledWith({ source: browserName, message: 'window closed' });
  });
}