import { it, expect, vi, beforeEach, describe } from 'vitest';
import { Npm } from '../Npm.js';
import type { Configuration } from '../configuration/Configuration.js';
import { factory } from './seleniumWebdriver.js';
import { RecoverableBrowserError } from './RecoverableBrowserError.js';

const NO_CONFIGURATION = {} as Configuration;
const CONFIGURATION_WITH_API_TIMEOUT = { seleniumApiTimeout: 50 } as Configuration;

const npmImportSpy = vi.spyOn(Npm, 'import');

const makeOptions = () => {
  const arguments_: string[] = [];
  return {
    addArguments: vi.fn((...a: string[]) => {
      arguments_.push(...a);
    }),
    enableBidi: vi.fn(),
    _args: arguments_
  };
};

type ChromeOptions = ReturnType<typeof makeOptions>;

const makeDriver = () => ({
  getCapabilities: vi.fn().mockResolvedValue({ get: vi.fn().mockReturnValue('chrome') }),
  getWindowHandle: vi.fn().mockResolvedValue('handle-1'),
  get: vi.fn().mockResolvedValue(undefined),
  switchTo: vi.fn().mockReturnValue({ window: vi.fn().mockReturnValue(undefined) }),
  executeScript: vi.fn().mockResolvedValue(undefined),
  takeScreenshot: vi.fn().mockResolvedValue(''),
  quit: vi.fn().mockResolvedValue(undefined)
});

const makeBuilderChain = (driver: ReturnType<typeof makeDriver>) => {
  const chain = {
    forBrowser: vi.fn().mockReturnThis(),
    setChromeOptions: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue(driver)
  };
  return chain;
};

const makeLogInspector = () => ({
  onConsoleEntry: vi.fn().mockResolvedValue(undefined)
});

const makeNetwork = () => ({
  responseStarted: vi.fn().mockResolvedValue(undefined)
});

const makeScriptManager = () => ({
  addPreloadScript: vi.fn().mockResolvedValue('preload-id')
});

const makeBrowsingContext = () => ({
  id: 'ctx-2',
  navigate: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined)
});

const makeContextParameters = () => ({
  background: vi.fn().mockReturnThis()
});

const setupMocks = (
  overrides: {
    options?: ChromeOptions;
    driver?: ReturnType<typeof makeDriver>;
  } = {}
) => {
  const driver = overrides.driver ?? makeDriver();
  const builderChain = makeBuilderChain(driver);
  const options: ChromeOptions = overrides.options ?? makeOptions();
  const logInspector = makeLogInspector();
  const network = makeNetwork();
  const scriptManager = makeScriptManager();
  const browsingContext = makeBrowsingContext();
  const contextParameters = makeContextParameters();

  npmImportSpy
    .mockResolvedValueOnce({
      Builder: vi.fn().mockImplementation(function () {
        return builderChain;
      }),
      Browser: { CHROME: 'chrome' }
    })
    .mockResolvedValueOnce({
      Options: vi.fn().mockImplementation(function () {
        return options;
      })
    })
    .mockResolvedValueOnce({ default: vi.fn().mockResolvedValue(logInspector) })
    .mockResolvedValueOnce({ default: vi.fn().mockResolvedValue(browsingContext) })
    .mockResolvedValueOnce({ default: vi.fn().mockResolvedValue(scriptManager) })
    .mockResolvedValueOnce({
      CreateContextParameters: vi.fn().mockImplementation(function () {
        return contextParameters;
      })
    })
    .mockResolvedValueOnce({ Network: vi.fn().mockResolvedValue(network) });

  return { driver, builderChain, options, logInspector, network, scriptManager, browsingContext, contextParameters };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('setup', () => {
  it('adds --window-size argument when settings.viewport is set', async () => {
    const { options } = setupMocks();
    const browser = await factory(NO_CONFIGURATION);
    await browser.setup({ viewport: { width: 1280, height: 720 }, visible: false });
    expect(options.addArguments).toHaveBeenCalledWith('--window-size=1280,720');
  });

  it('does not add --window-size argument when settings.viewport is not set', async () => {
    const { options } = setupMocks();
    const browser = await factory(NO_CONFIGURATION);
    await browser.setup({ visible: false });
    expect(options.addArguments).not.toHaveBeenCalledWith(expect.stringContaining('--window-size='));
  });
});

describe('newWindow', () => {
  it('uses getWindowHandle and driver.get for the first window', async () => {
    const { driver } = setupMocks();
    const browser = await factory(NO_CONFIGURATION);
    await browser.setup({ visible: false });
    await browser.newWindow({ pageId: 1, scripts: [], url: 'http://localhost/page1.html' });
    expect(driver.getWindowHandle).toHaveBeenCalled();
    expect(driver.get).toHaveBeenCalledWith('http://localhost/page1.html');
  });

  it('uses BrowsingContext for the second and subsequent windows', async () => {
    const { browsingContext } = setupMocks();
    const browser = await factory(NO_CONFIGURATION);
    await browser.setup({ visible: false });
    // First window — consumes isFirst=true
    await browser.newWindow({ pageId: 1, scripts: [], url: 'http://localhost/page1.html' });
    // Second window — should use BrowsingContext path
    await browser.newWindow({ pageId: 2, scripts: [], url: 'http://localhost/page2.html' });
    expect(browsingContext.navigate).toHaveBeenCalledWith('http://localhost/page2.html', 'interactive');
  });
});

describe('seleniumApiTimeout', () => {
  const HANGING = new Promise<never>(() => {});

  it('rejects eval with RecoverableBrowserError when the driver does not respond in time', async () => {
    const driver = makeDriver();
    driver.executeScript.mockReturnValue(HANGING);
    setupMocks({ driver });
    const browser = await factory(CONFIGURATION_WITH_API_TIMEOUT);
    await browser.setup({ visible: false });
    const window = await browser.newWindow({ pageId: 1, scripts: [], url: 'http://localhost/page1.html' });
    await expect(window.eval('window.foo')).rejects.toThrow(RecoverableBrowserError);
    await expect(window.eval('window.foo')).rejects.toThrow('session may have expired');
  });

  it('rejects screenshot with RecoverableBrowserError when the driver does not respond in time', async () => {
    const driver = makeDriver();
    driver.takeScreenshot.mockReturnValue(HANGING);
    setupMocks({ driver });
    const browser = await factory(CONFIGURATION_WITH_API_TIMEOUT);
    await browser.setup({ visible: false });
    const window = await browser.newWindow({ pageId: 1, scripts: [], url: 'http://localhost/page1.html' });
    await expect(window.screenshot('/tmp/shot.png')).rejects.toThrow(RecoverableBrowserError);
    await expect(window.screenshot('/tmp/shot.png')).rejects.toThrow('session may have expired');
  });
});
