const { join } = require('path')

module.exports = async ({
  seleniumWebdriver,
  settings,
  options,
  loggingPreferences,
  $capabilities
}) => {
  const { Browser, Builder } = seleniumWebdriver
  const firefox = require(join(settings.modules['selenium-webdriver'], 'firefox'))

  const firefoxOptions = new firefox.Options()
  if (!options.visible) {
    firefoxOptions.headless = true
  }
  firefoxOptions.setLoggingPrefs(loggingPreferences)
  if (options.binary) {
    firefoxOptions.setBinary(options.binary)
  }

  const builder = new Builder()
    .forBrowser(Browser.FIREFOX)
    .setFirefoxOptions(firefoxOptions)

  if (options.server) {
    builder.usingServer(options.server)
  }


  const driver = await builder.build()

  // https://github.com/mozilla/geckodriver/issues/330
  driver[$capabilities] = {
    traces: ['network']
  }

  return driver
}
