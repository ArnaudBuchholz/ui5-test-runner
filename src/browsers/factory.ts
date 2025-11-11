import type { IBrowser } from './IBrowser.js';
import { factory as puppeteerFactory } from './puppeteer.js';

export type Browser = 'puppeteer';

const factories: { [key in Browser]: () => Promise<IBrowser> } = {
  puppeteer: puppeteerFactory
};

export const BrowserFactory = {
  async build(browser: Browser): Promise<IBrowser> {
    return await factories[browser]();
  }
};
