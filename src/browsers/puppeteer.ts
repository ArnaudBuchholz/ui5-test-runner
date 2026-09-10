import { logger, Process } from '../platform/index.js';
import type { BrowserCapabilities, BrowserSettings, IBrowser } from './IBrowser.js';
import type { launch as launchFunction, Browser, Page } from 'puppeteer';
import { Npm } from '../Npm.js';
import type { Configuration } from '../configuration/Configuration.js';
import { handleConsoleMessage } from './consoleMessage.js';

export const factory = async (configuration: Configuration, signal: AbortSignal): Promise<IBrowser> => {
  const puppeteer = await Npm.import(configuration, 'puppeteer');
  const launch = (puppeteer as { launch: typeof launchFunction }).launch;
  let browser: Browser | undefined;
  let openedPages = 0;

  const launchAndInstallIfNeeded = async (settings: BrowserSettings): Promise<BrowserCapabilities> => {
    // TODO maximize should not be set when viewport is set
    const arguments_: string[] = ['--start-maximized'];
    if (settings.viewport) {
      arguments_.push(`--window-size=${settings.viewport.width},${settings.viewport.height}`);
    }
    const launchOptions: Parameters<typeof launch>[0] = {
      headless: !settings.visible,
      defaultViewport: null,
      handleSIGINT: false,
      signal,
      args: arguments_
    };
    logger.debug({ source: 'puppeteer', message: 'launching browser' });
    try {
      browser = await launch(launchOptions);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Could not find Chrome')) {
        // TODO: is there a way to monitor the progress ?
        // YES: using https://pptr.dev/browsers-api/browsers.installoptions
        logger.info({
          source: 'progress',
          message: 'Installing chrome (puppeteer)',
          pageId: undefined,
          data: {
            value: 1,
            max: 0
          }
        });
        await Process.spawn('npx', 'puppeteer browsers install chrome'.split(' '), {
          shell: true,
          signal
        }).closed;
        browser = await launch(launchOptions);
      } else {
        throw error;
      }
    }
    return {
      screenshotFormat: '.png',
      browserName: 'chrome',
      browserVersion: await browser.version()
    };
  };

  return {
    async setup(settings) {
      return await launchAndInstallIfNeeded(settings);
    },

    async newWindow(settings) {
      const { pageId } = settings;
      let page: Page | undefined;
      if (++openedPages === 1) {
        const pages = await browser?.pages(true);
        page = pages?.[0];
      } else {
        page = await browser?.newPage({
          type: 'window'
        });
      }
      for (const script of settings.scripts) {
        await page?.evaluateOnNewDocument(script);
      }
      page
        ?.on('console', (message) => {
          handleConsoleMessage(message.type(), message.text(), pageId);
        })
        ?.on('response', (response) => {
          const request = response.request();
          const statusType = Math.floor(response.status() / 100);
          const LOG_TYPES = [null, null, null, null, 'warn', 'error'] as const;
          const logType = LOG_TYPES[statusType] ?? 'info';
          logger[logType]({
            source: 'browser/network',
            message: request.url(),
            pageId,
            data: {
              request: {
                method: request.method(),
                headers: request.headers()
              },
              response: {
                status: response.status(),
                headers: response.headers()
              }
            }
          });
        });
      await page?.goto(settings.url);
      return {
        async eval(script: string) {
          return await page?.evaluate(script);
        },
        async screenshot(path: string) {
          await page?.screenshot({ path });
        },
        async close() {
          await page?.close();
        }
      };
    },

    async shutdown() {
      await browser?.close();
    }
  };
};
