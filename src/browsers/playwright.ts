import { logger, Process, assert } from '../platform/index.js';
import type { BrowserCapabilities, BrowserSettings, IBrowser } from './IBrowser.js';
import type { BrowserType, Browser, Page, ConsoleMessage } from 'playwright';
import { Npm } from '../Npm.js';
import type { ILogger } from '../platform/logger/ILogger.js';
import { agentLogPrefix } from '../types/AgentState.js';
import type { LogSource } from '../platform/logger/types.js';
import type { Configuration } from '../configuration/Configuration.js';

export const factory = async (configuration: Configuration, signal: AbortSignal): Promise<IBrowser> => {
  const playwright = await Npm.import(configuration, 'playwright');
  const { chromium } = playwright as { chromium: BrowserType };
  let browser: Browser | undefined;
  let openedPages = 0;

  const launchAndInstallIfNeeded = async (settings: BrowserSettings): Promise<BrowserCapabilities> => {
    logger.debug({ source: 'playwright', message: 'launching browser' });
    try {
      // TODO define args for chrome
      browser = await chromium.launch({
        headless: !settings.visible,
        handleSIGINT: false
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Executable doesn')) {
        logger.info({
          source: 'progress',
          message: 'Installing chromium (playwright)',
          pageId: undefined,
          data: {
            value: 1,
            max: 0
          }
        });
        await Process.spawn('npx', 'playwright install chromium'.split(' '), {
          shell: true,
          signal
        }).closed;
        browser = await chromium.launch({
          headless: !settings.visible,
          handleSIGINT: false
        });
      } else {
        throw error;
      }
    }
    return {
      screenshotFormat: '.png',
      browserName: browser.browserType().name(),
      browserVersion: browser.version()
    };
  };

  return {
    async setup(settings) {
      return await launchAndInstallIfNeeded(settings);
    },

    async newWindow(settings) {
      let page: Page | undefined;
      if (++openedPages === 1) {
        const pages = browser?.contexts()[0]?.pages();
        page = pages?.[0] ?? (await browser?.newPage());
      } else {
        page = await browser?.newPage();
      }
      assert(page !== undefined);
      for (const script of settings.scripts) {
        await page.addInitScript(script);
      }
      const { pageId } = settings;
      page
        .on('console', (message: ConsoleMessage) => {
          const LOG_TYPES: { [key: string]: keyof ILogger } = {
            error: 'error',
            warn: 'warn',
            assert: 'warn',
            debug: 'debug'
          } as const;
          const logType = LOG_TYPES[message.type()] ?? 'info';
          let source: LogSource;
          let messageText = message.text();
          if (messageText.startsWith(agentLogPrefix)) {
            source = 'browser/agent';
            messageText = messageText.slice(agentLogPrefix.length);
          } else {
            source = 'browser/console';
          }
          logger[logType]({
            source,
            message: messageText,
            pageId,
            data: { type: message.type() }
          });
        })
        .on('response', (response) => {
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
      await page.goto(settings.url);
      return {
        async eval(script: string) {
          return await page?.evaluate(script);
        },
        async screenshot(path: string) {
          await page.screenshot({ path });
        },
        async close() {
          await page.close();
        }
      };
    },

    async shutdown() {
      await browser?.close();
    }
  };
};
