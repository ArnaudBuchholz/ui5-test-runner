import { BrowserFactory } from '../../browsers/factory.js';
import type { IBrowser } from '../../browsers/IBrowser.js';
import { Configuration } from '../../configuration/Configuration.js';
import { logger } from '../../platform/logger.js';

let browser: IBrowser;

export const setupBrowser = async (configuration: Configuration): Promise<IBrowser> => {
  browser = await BrowserFactory.build('puppeteer');
  try {
    await browser.setup({});
  } catch (error) {
    logger.fatal({ source: 'job', message: 'Unable to setup browser', error });
    throw error; // TODO: Use a normalized error with an associated exit code
  }
  return browser;
}

export const getBrowser = (): IBrowser => browser;
