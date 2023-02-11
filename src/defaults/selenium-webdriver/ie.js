const { join } = require('path')

module.exports = async ({
  seleniumWebdriver,
  settings,
  options,
  loggingPreferences
}) => {
  const { Browser, Builder } = seleniumWebdriver
  const ie = require(join(settings.modules['selenium-webdriver'], 'ie'))

  const ieOptions = new ie.Options()

  const builder = new Builder()
    .forBrowser(Browser.INTERNET_EXPLORER)
    .setIeOptions(ieOptions)

  if (options.server) {
    builder.usingServer(options.server)
  }

  return await builder.build()
}
