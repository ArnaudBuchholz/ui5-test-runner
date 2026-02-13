import { BrowserFactory } from '../../browsers/factory.js';
import type { IBrowser } from '../../browsers/IBrowser.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { assert } from '../../platform/assert.js';
import { logger } from '../../platform/logger.js';

let browser: IBrowser;

export const setupBrowser = async (configuration: Configuration): Promise<IBrowser> => {
  assert(configuration.browser === 'puppeteer');
  browser = await BrowserFactory.build('puppeteer');
  try {
    await browser.setup({});
  } catch (error) {
    logger.fatal({ source: 'job', message: 'Unable to setup browser', error });
    throw error; // TODO: Use a normalized error with an associated exit code
  }
  return browser;
};

export const getBrowser = (): IBrowser => browser;
