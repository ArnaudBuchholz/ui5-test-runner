const { join } = require('path')

module.exports = async ({
  seleniumWebdriver,
  settings,
  options,
  loggingPreferences
}) => {
  const { Browser, Builder } = seleniumWebdriver
  const chrome = require(join(settings.modules['selenium-webdriver'], 'chrome'))

  const chromeOptions = new chrome.Options()
  if (!options.visible) {
    chromeOptions.addArguments('--headless=new')
    chromeOptions.addArguments('--log-level=3')
  }
  chromeOptions.addArguments('--start-maximized')
  chromeOptions.addArguments('--disable-extensions')
  chromeOptions.setLoggingPrefs(loggingPreferences)
  if (options.binary) {
    chromeOptions.setChromeBinaryPath(options.binary)
  }
  chromeOptions.excludeSwitches('--enable-logging')

  const builder = new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions)

  if (options.server) {
    builder.usingServer(options.server)
  }

  const driver = await builder.build()
  driver.__console__ = true
  driver.__addScript__ = async function (source) {
    return await driver.sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument', { source })
  }
  return driver
}
