import type { Configuration } from '../configuration/Configuration.js';
import type { IBrowser } from './IBrowser.js';
import { factory as puppeteerFactory } from './puppeteer.js';
import { factory as playwrightFactory } from './playwright.js';

export type Browser = 'puppeteer' | 'playwright' | 'webdriverio' | 'selenium-webdriver';

const notImplemented = () => {
  throw new Error('Not implemented');
};

const factories: { [key in Browser]: (configuration: Configuration) => Promise<IBrowser> } = {
  puppeteer: puppeteerFactory,
  playwright: playwrightFactory,
  webdriverio: notImplemented,
  'selenium-webdriver': notImplemented
};

export const BrowserFactory = {
  async build(configuration: Configuration, browser: Browser): Promise<IBrowser> {
    return await factories[browser](configuration);
  }
};
