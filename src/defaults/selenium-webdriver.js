'use strict'

const { InvalidArgumentError } = require('commander')
const { boolean, /* integer, */ url } = require('../options')
const { writeFile } = require('fs/promises')

const $capabilities = Symbol('capabilities')

let logging
let driver

function browser (value, defaultValue) {
  if (value === undefined) {
    return 'chrome'
  }
  if (!['chrome', 'firefox', 'ie', 'edge'].includes(value)) {
    throw new InvalidArgumentError('Browser name')
  }
  return value
}

async function buildDriver (settings, options) {
  const seleniumWebdriver = require(settings.modules['selenium-webdriver'])

  logging = seleniumWebdriver.logging
  logging.getLogger(logging.Type.BROWSER).setLevel(logging.Level.ALL)

  const loggingPreferences = new logging.Preferences()
  loggingPreferences.setLevel(logging.Type.BROWSER, logging.Level.ALL)

  driver = await require('./selenium-webdriver/' + options.browser)({
    seleniumWebdriver,
    settings,
    options,
    loggingPreferences,
    $capabilities
  })
}

require('./browser')({
  name: 'selenium-webdriver',

  options (command) {
    command
      .option('-b, --browser <name>', 'Browser driver', browser, 'chrome')
      .option('--visible [flag]', 'Show the browser', boolean, false)
      // .option('-w, --viewport-width <width>', 'Viewport width', integer, 1920)
      // .option('-h, --viewport-height <height>', 'Viewport height', integer, 1080)
      // .option('-l, --language <lang...>', 'Language(s)', ['en-US'])
      .option('-s, --server <server>', 'Selenium server URL', url)
      .option('--binary <binary>', 'Binary path')
  },

  async screenshot (filename) {
    if (driver) {
      const data = await driver.takeScreenshot()
      await writeFile(filename, data.replace(/^data:image\/png;base64,/, ''), {
        encoding: 'base64'
      })
      return true
    }
  },

  async flush ({
    consoleWriter
  }) {
    if (driver) {
      const logs = await driver.manage().logs().get(logging.Type.BROWSER)
      const logLevelMapping = {
        INFO: 'log',
        WARNING: 'warning',
        SEVERE: 'error'
      }
      if (logs.length) {
        consoleWriter.append(logs.map(({ timestamp, message, level }) => {
          return {
            timestamp,
            type: logLevelMapping[level.toString()],
            text: message
          }
        }))
      }
    }
  },

  async beforeExit () {
    if (driver) {
      await driver.quit()
    }
  },

  async capabilities ({ settings, options }) {
    const capabilities = {
      modules: ['selenium-webdriver'],
      screenshot: '.png',
      scripts: true,
      traces: ['console', 'network'],
      'selenium-webdriver:browser': options.browser,
      'selenium-webdriver:server': options.server,
      'selenium-webdriver:binary': options.binary
    }
    if (!settings.modules) {
      return {
        ...capabilities,
        'probe-with-modules': true
      }
    }
    await buildDriver(settings, options)
    return Object.assign(
      capabilities,
      driver[$capabilities] || {} // Enable override
    )
  },

  async run ({
    settings,
    options
  }) {
    await buildDriver(settings, options)

    const { url, scripts } = settings

    if (scripts && scripts.length) {
      for await (const script of scripts) {
        await driver.sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument', { source: script })
      }
    }

    await driver.get(url)
  },

  async error (e, exit) {
    if (e.name === 'SessionNotCreatedError') {
      console.error(e.message)
    } else {
      console.error(e)
    }
    console.error('Please check https://www.npmjs.com/package/selenium-webdriver#installation for browser driver')
  }
})
