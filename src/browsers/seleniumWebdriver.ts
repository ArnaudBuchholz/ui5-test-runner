import { logger } from '../platform/index.js';
import type { BrowserCapabilities, BrowserDriverDescriptor, BrowserSettings, IBrowser } from './IBrowser.js';
import { Npm } from '../Npm.js';
import type { Configuration } from '../configuration/Configuration.js';
import { handleConsoleMessage } from './consoleMessage.js';
import { handleNetworkResponse } from './networkResponse.js';
import { getExtraChromeArguments } from './chromeArguments.js';
import { writeFile } from 'node:fs/promises';
import type { Builder, ThenableWebDriver } from 'selenium-webdriver';
import type { Options } from 'selenium-webdriver/chrome';
import type getLogInspectorInstance from 'selenium-webdriver/bidi/logInspector';
import type getBrowsingContextInstance from 'selenium-webdriver/bidi/browsingContext';
import type getScriptManagerInstance from 'selenium-webdriver/bidi/scriptManager';
import type CreateContextParameters from 'selenium-webdriver/bidi/createContextParameters';
import type { Header } from 'selenium-webdriver/bidi/networkTypes';

export const descriptor: BrowserDriverDescriptor = {
  supportedBrowsers: ['chrome', 'firefox', 'edge', 'safari'],
  defaultBrowser: 'chrome',
  screenshotFormat: '.png'
};

type NetworkEvent = {
  id: string | null;
  request: { url: string; method: string; headers: Header[] };
  response: { status: number; headers: Header[] };
};
type NetworkFactory = (driver: ThenableWebDriver) => Promise<{
  responseStarted(callback: (event: NetworkEvent | null) => void): Promise<number>;
}>;

const headersToObject = (headers: Header[]): Record<string, string> =>
  Object.fromEntries(headers.map(({ name, value }) => [name.toLowerCase(), value.value ?? '']));

export const factory = async (configuration: Configuration): Promise<IBrowser> => {
  const selenium = await Npm.import(configuration, 'selenium-webdriver');
  const { Builder: SeleniumBuilder, Browser } = selenium as { Builder: typeof Builder; Browser: { CHROME: string } };

  const { Options: ChromeOptions } = (await Npm.import(configuration, 'selenium-webdriver/chrome')) as {
    Options: typeof Options;
  };

  const LogInspector = (
    (await Npm.import(configuration, 'selenium-webdriver/bidi/logInspector')) as {
      default: typeof getLogInspectorInstance;
    }
  ).default;
  const BrowsingContext = (
    (await Npm.import(configuration, 'selenium-webdriver/bidi/browsingContext')) as {
      default: typeof getBrowsingContextInstance;
    }
  ).default;
  const ScriptManager = (
    (await Npm.import(configuration, 'selenium-webdriver/bidi/scriptManager')) as {
      default: typeof getScriptManagerInstance;
    }
  ).default;
  const { CreateContextParameters: CreateContextParametersClass } = (await Npm.import(
    configuration,
    'selenium-webdriver/bidi/createContextParameters'
  )) as { CreateContextParameters: typeof CreateContextParameters };

  const { Network } = (await Npm.import(configuration, 'selenium-webdriver/bidi/network')) as {
    Network: NetworkFactory;
  };

  let driver: ThenableWebDriver | undefined;
  const contextToPageId = new Map<string, number>();
  let isFirstWindow = true;

  return {
    async setup(settings: BrowserSettings): Promise<BrowserCapabilities> {
      logger.debug({ source: 'selenium-webdriver', message: 'launching browser' });
      const options = new ChromeOptions();
      if (!settings.visible) {
        options.addArguments('--headless');
      }
      options.addArguments('--start-maximized');
      if (settings.viewport) {
        options.addArguments(`--window-size=${settings.viewport.width},${settings.viewport.height}`);
      }
      options.addArguments(...getExtraChromeArguments());
      options.enableBidi();

      driver = new SeleniumBuilder().forBrowser(Browser.CHROME).setChromeOptions(options).build();
      const caps = await driver.getCapabilities();

      const logInspector = await LogInspector(driver);
      await logInspector.onConsoleEntry((entry) => {
        const pageId =
          (entry.source.browsingContextId === null ? undefined : contextToPageId.get(entry.source.browsingContextId)) ??
          -1;
        handleConsoleMessage(entry.method, entry.text, pageId);
      });

      const network = await Network(driver);
      await network.responseStarted((event) => {
        if (event === null || !('response' in event)) return;
        const pageId = (event.id === null ? undefined : contextToPageId.get(event.id)) ?? -1;
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
        browserName: (caps.get('browserName') as string | undefined) ?? 'chrome',
        browserVersion: (caps.get('browserVersion') as string | undefined) ?? ''
      };
    },

    async newWindow(settings) {
      const { pageId, scripts, url } = settings;
      const isFirst = isFirstWindow;
      isFirstWindow = false;

      let context: string;

      if (isFirst) {
        context = await driver!.getWindowHandle();
        contextToPageId.set(context, pageId);
        for (const script of scripts) {
          const sm = await (
            ScriptManager as unknown as (
              id: string,
              driver: ThenableWebDriver
            ) => Promise<{ addPreloadScript(s: string): Promise<string> }>
          )(context, driver!);
          await sm.addPreloadScript(`() => { ${script} }`);
        }
        await driver!.get(url);
      } else {
        const tabParameters = new CreateContextParametersClass().background(true);
        const bc = await BrowsingContext(driver!, { type: 'tab', createParameters: tabParameters });
        context = bc.id!;
        contextToPageId.set(context, pageId);
        for (const script of scripts) {
          const sm = await (
            ScriptManager as unknown as (
              id: string,
              driver: ThenableWebDriver
            ) => Promise<{ addPreloadScript(s: string): Promise<string> }>
          )(context, driver!);
          await sm.addPreloadScript(`() => { ${script} }`);
        }
        await bc.navigate(url, 'interactive');
      }

      return {
        async eval(script: string) {
          await driver!.switchTo().window(context);
          return driver!.executeScript<unknown>(`return (${script})`);
        },
        async screenshot(path: string) {
          await driver!.switchTo().window(context);
          const data = await driver!.takeScreenshot();
          await writeFile(path, Buffer.from(data, 'base64'));
        },
        async close() {
          contextToPageId.delete(context);
          if (contextToPageId.size === 0) {
            // Keep the BiDi session alive: open a blank keeper tab before closing the last real one
            await BrowsingContext(driver!, { type: 'tab' });
          }
          const bc = await BrowsingContext(driver!, { browsingContextId: context });
          await bc.close();
        }
      };
    },

    async shutdown() {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await driver?.quit();
    }
  };
};
