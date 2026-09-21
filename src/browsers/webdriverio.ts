import { logger, Path } from '../platform/index.js';
import type { BrowserCapabilities, BrowserDriverDescriptor, BrowserSettings, IBrowser } from './IBrowser.js';
import { Npm } from '../Npm.js';
import type { Configuration } from '../configuration/Configuration.js';
import { handleConsoleMessage } from './consoleMessage.js';
import { handleNetworkResponse } from './networkResponse.js';

export const descriptor: BrowserDriverDescriptor = {
  supportedBrowsers: ['chrome', 'firefox', 'edge', 'safari'],
  defaultBrowser: 'chrome',
  screenshotFormat: '.png'
};

type WdioBidiHeaderValue = { type: string; value: string };
type WdioHeader = { name: string; value: string | WdioBidiHeaderValue };
type WdioBrowser = {
  capabilities: { browserName?: string; browserVersion?: string };
  on(event: string, listener: (data: unknown) => void): void;
  off(event: string, listener: (data: unknown) => void): void;
  browsingContextClose(options: { context: string }): Promise<void>;
  browsingContextCreate(options: { type: string; background?: boolean }): Promise<{ context: string }>;
  browsingContextNavigate(options: { context: string; url: string; wait?: string }): Promise<unknown>;
  sessionSubscribe(options: { events: string[] }): Promise<void>;
  scriptAddPreloadScript(options: { functionDeclaration: string; contexts?: string[] }): Promise<unknown>;
  url(url: string): Promise<void>;
  execute<T>(script: string): Promise<T>;
  saveScreenshot(path: string): Promise<void>;
  getWindowHandle(): Promise<string>;
  getWindowHandles(): Promise<string[]>;
  switchToWindow(handle: string): Promise<void>;
  deleteSession(): Promise<void>;
};

const headerValue = (value: string | WdioBidiHeaderValue): string =>
  typeof value === 'string' ? value : (value?.value ?? '');

const headersToObject = (headers: WdioHeader[] | undefined): Record<string, string> =>
  Object.fromEntries((headers ?? []).map(({ name, value }) => [name.toLowerCase(), headerValue(value)]));

export const factory = async (configuration: Configuration): Promise<IBrowser> => {
  const webdriverio = await Npm.import(configuration, 'webdriverio');
  const { remote } = webdriverio as { remote: (options: unknown) => Promise<WdioBrowser> };
  let browser: WdioBrowser | undefined;
  const contextToPageId = new Map<string, number>();
  return {
    async setup(settings: BrowserSettings): Promise<BrowserCapabilities> {
      logger.debug({ source: 'webdriverio', message: 'launching browser' });
      process.env['WDIO_LOG_PATH'] = Path.join(configuration.reportDir, 'wdio.log');
      browser = await remote({
        capabilities: {
          browserName: 'chrome',
          webSocketUrl: true,
          'goog:chromeOptions': {
            args: [
              ...(settings.visible ? [] : ['--headless']),
              '--start-maximized',
              ...(settings.viewport ? [`--window-size=${settings.viewport.width},${settings.viewport.height}`] : [])
            ]
          }
        }
      });
      browser.on('log.entryAdded', (entry) => {
        const event = entry as { type?: string; method?: string; text?: string | null; source?: { context?: string } };
        if (event.type === 'console') {
          const pageId =
            (event.source?.context === undefined ? undefined : contextToPageId.get(event.source.context)) ?? -1;
          handleConsoleMessage(event.method ?? 'log', event.text ?? '', pageId);
        }
      });
      await browser.sessionSubscribe({ events: ['network.responseStarted'] });
      browser.on('network.responseStarted', (entry) => {
        const event = entry as {
          context: string | null;
          request: { url: string; method: string; headers: WdioHeader[] };
          response: { status: number; headers: WdioHeader[] };
        };
        const pageId = (event.context === null ? undefined : contextToPageId.get(event.context)) ?? -1;
        handleNetworkResponse(
          pageId,
          event.request.url,
          event.request.method,
          event.response.status,
          headersToObject(event.request.headers),
          headersToObject(event.response.headers)
        );
      });
      return {
        browserName: browser.capabilities.browserName ?? 'chrome',
        browserVersion: browser.capabilities.browserVersion ?? ''
      };
    },

    async newWindow(settings) {
      const { pageId, scripts, url } = settings;
      const { context } = await browser!.browsingContextCreate({ type: 'tab', background: true });
      contextToPageId.set(context, pageId);
      for (const script of scripts) {
        await browser!.scriptAddPreloadScript({
          functionDeclaration: `() => { ${script} }`,
          contexts: [context]
        });
      }
      await browser!.browsingContextNavigate({ context, url, wait: 'interactive' });

      const switchTo = () => browser!.switchToWindow(context);
      return {
        async eval(script: string) {
          await switchTo();
          return browser!.execute<unknown>(`return (${script})`);
        },
        async screenshot(path: string) {
          await switchTo();
          await browser!.saveScreenshot(path);
        },
        async close() {
          contextToPageId.delete(context);
          await browser!.browsingContextClose({ context });
        }
      };
    },

    async shutdown() {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await browser?.deleteSession();
      delete process.env['WDIO_LOG_PATH'];
    }
  };
};
