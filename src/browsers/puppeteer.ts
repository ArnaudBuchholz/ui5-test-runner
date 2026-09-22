import { logger, Process } from '../platform/index.js';
import type { BrowserCapabilities, BrowserDriverDescriptor, BrowserSettings, IBrowser } from './IBrowser.js';
import type { launch as launchFunction, Browser, Page } from 'puppeteer';
import { Npm } from '../Npm.js';
import type { Configuration } from '../configuration/Configuration.js';
import { handleConsoleMessage } from './consoleMessage.js';
import { handleNetworkResponse } from './networkResponse.js';
import { getExtraChromeArguments } from './chromeArguments.js';

export const descriptor: BrowserDriverDescriptor = {
  supportedBrowsers: ['chrome', 'firefox'],
  defaultBrowser: 'chrome',
  screenshotFormat: '.png'
};

export const factory = async (configuration: Configuration, signal: AbortSignal): Promise<IBrowser> => {
  const puppeteer = await Npm.import(configuration, 'puppeteer');
  const launch = (puppeteer as { launch: typeof launchFunction }).launch;
  let browser: Browser | undefined;
  let isFirstWindow = true;

  const launchAndInstallIfNeeded = async (settings: BrowserSettings): Promise<BrowserCapabilities> => {
    const target = settings.browser ?? 'chrome';
    // TODO maximize should not be set when viewport is set
    const arguments_ = [
      settings.viewport ? `--window-size=${settings.viewport.width},${settings.viewport.height}` : '--start-maximized'
    ];
    const rawArguments = settings.options?.['args'];
    const extraArguments = Array.isArray(rawArguments)
      ? rawArguments.filter((a): a is string => typeof a === 'string')
      : [];
    const launchOptions: Parameters<typeof launch>[0] = {
      browser: target as 'chrome' | 'firefox',
      headless: !settings.visible,
      defaultViewport: null,
      handleSIGINT: false,
      signal,
      args: [...arguments_, ...extraArguments, ...(target === 'chrome' ? getExtraChromeArguments() : [])]
    };
    logger.debug({ source: 'puppeteer', message: 'launching browser' });
    try {
      browser = await launch(launchOptions);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Could not find')) {
        // TODO: is there a way to monitor the progress ?
        // YES: using https://pptr.dev/browsers-api/browsers.installoptions
        logger.info({
          source: 'progress',
          message: `Installing ${target} (puppeteer)`,
          pageId: undefined,
          data: {
            value: 1,
            max: 0
          }
        });
        await Process.spawn('npx', `puppeteer browsers install ${target}`.split(' '), {
          shell: true,
          signal
        }).closed;
        browser = await launch(launchOptions);
      } else {
        throw error;
      }
    }
    return {
      browserName: target,
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
      if (isFirstWindow) {
        isFirstWindow = false;
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
          handleNetworkResponse(
            pageId,
            request.url(),
            request.method(),
            response.status(),
            request.headers(),
            response.headers()
          );
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
