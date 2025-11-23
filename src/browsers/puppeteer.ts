import type { IBrowser } from './IBrowser.js';
import type { launch as launchFunction, Browser } from 'puppeteer';
import { Npm } from '../Npm.js';
import { logger } from '../logger.js';

export const factory = async (): Promise<IBrowser> => {
  const puppeteer = await Npm.import('puppeteer');
  const { launch } = puppeteer as { launch: typeof launchFunction };
  let browser: Browser | undefined;

  return {
    async setup(settings) {
      logger.info({ source: 'puppeteer', message: 'setup', data: settings });
      browser = await launch({
        headless: false,
        defaultViewport: null
      });
      return {
        screenshotFormat: '.png'
      };
    },

    async newWindow(settings) {
      logger.info({ source: 'puppeteer', message: 'newWindow', data: settings });
      const page = await browser?.newPage();
      for (const script of settings.scripts) {
        await page?.evaluateOnNewDocument(script);
      }
      await page?.goto(settings.url);
      return {
        async eval(script: string) {
          return await page?.evaluate(script);
        },
        screenshot(/* path: string */) {
          throw new Error('Not implemented');
        },
        async close() {
          await page?.close();
        }
      };
    },

    async shutdown() {
      // TODO close any remaining pages
      await browser?.close();
    }
  };
};
