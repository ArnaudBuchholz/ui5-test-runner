import { logger, Exit, Process, assert } from '../platform/index.js';
import type { BrowserCapabilities, BrowserSettings, IBrowser } from './IBrowser.js';
import type { BrowserType, Browser, Page, ConsoleMessage } from 'playwright';
import { Npm } from '../Npm.js';
import type { ILogger } from '../platform/logger/ILogger.js';
import { agentLogPrefix } from '../types/AgentState.js';
import type { LogSource } from '../platform/logger/types.js';
import type { Configuration } from '../configuration/Configuration.js';

export const factory = async (configuration: Configuration): Promise<IBrowser> => {
  const playwright = await Npm.import(configuration, 'playwright');
  const { chromium } = playwright as { chromium: BrowserType };
  let browser: Browser | undefined;
  const abortController = new AbortController();
  const { signal } = abortController;
  const task = Exit.registerAsyncTask({
    name: 'playwright',
    async stop() {
      abortController.abort();
      await browser?.close();
    }
  });
  let openedPages = 0;

  const launchAndInstallIfNeeded = async (settings: BrowserSettings): Promise<BrowserCapabilities> => {
    logger.debug({ source: 'playwright', message: 'launching browser' });
    try {
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
    logger.debug({ source: 'playwright', message: 'setup completed' });
    return {
      screenshotFormat: '.png'
    };
  };

  return {
    async setup(settings) {
      logger.debug({ source: 'playwright', message: 'setup', data: settings });
      try {
        return await launchAndInstallIfNeeded(settings);
      } catch (error) {
        logger.error({ source: 'playwright', message: 'setup failed', error });
        task[Symbol.dispose]();
        throw error;
      }
    },

    async newWindow(settings) {
      logger.debug({ source: 'playwright', message: 'newWindow', data: settings });
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
      logger.debug({ source: 'playwright', message: 'newWindow completed', data: settings });
      return {
        async eval(script: string) {
          return await page?.evaluate(script);
        },
        screenshot(/* path: string */) {
          throw new Error('Not implemented');
        },
        async close() {
          try {
            await page.close();
          } catch (error) {
            logger.error({ source: 'playwright', message: 'page.close failed', error });
          }
        }
      };
    },

    async shutdown() {
      logger.debug({ source: 'playwright', message: 'shutdown' });
      try {
        await browser?.close();
      } catch (error) {
        logger.error({ source: 'playwright', message: 'browser.close failed', error });
      }
      task[Symbol.dispose]();
    }
  };
};
