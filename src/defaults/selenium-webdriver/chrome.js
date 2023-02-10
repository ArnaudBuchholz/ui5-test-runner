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
  chromeOptions.excludeSwitches('enable-logging')
  if (!options.visible) {
    chromeOptions.addArguments('headless')
  }
  chromeOptions.addArguments('start-maximized')
  chromeOptions.addArguments('disable-extensions')
  chromeOptions.setLoggingPrefs(loggingPreferences)
  if (options.binary) {
    chromeOptions.setBinary(options.binary)
  }

  const builder = new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions)

  if (options.server) {
    builder.usingServer(options.server)
  }

  return await builder.build()
}
