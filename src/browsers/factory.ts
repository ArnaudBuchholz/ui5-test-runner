import type { Configuration } from '../configuration/Configuration.js';
import type { IBrowser } from './IBrowser.js';
import { factory as puppeteerFactory } from './puppeteer.js';

export type Browser = 'puppeteer';

const factories: { [key in Browser]: (configuration: Configuration) => Promise<IBrowser> } = {
  puppeteer: puppeteerFactory
};

export const BrowserFactory = {
  async build(configuration: Configuration, browser: Browser): Promise<IBrowser> {
    return await factories[browser](configuration);
  }
};
