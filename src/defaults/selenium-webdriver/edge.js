const { join } = require('path')

module.exports = async ({
  seleniumWebdriver,
  settings,
  options,
  loggingPreferences,
  $capabilities
}) => {
  const { Browser, Builder } = seleniumWebdriver
  const edge = require(join(settings.modules['selenium-webdriver'], 'edge'))

  const edgeOptions = new edge.Options()
  edgeOptions.setLoggingPrefs(loggingPreferences)

  const builder = new Builder()
    .forBrowser(Browser.EDGE)
    .setEdgeOptions(edgeOptions)

  if (options.server) {
    builder.usingServer(options.server)
  }

  return await builder.build()
}
