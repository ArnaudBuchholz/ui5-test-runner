'use strict'

const { InvalidArgumentError } = require('commander')
const { boolean, integer } = require('../options')
const { writeFile } = require('fs/promises')

let logging
let driver

function browser (value, defaultValue) {
  if (value === undefined) {
    return 'chrome'
  }
  if (!['chrome'].includes(value)) {
    throw new InvalidArgumentError('Browser name')
  }
  return value
}

async function buildDriver (settings, options) {
  const seleniumWebdriver = require(settings.modules['selenium-webdriver'])

  logging = seleniumWebdriver.logging
  logging.getLogger(logging.Type.BROWSER).setLevel(logging.Level.ALL)

  const loggingPreferences = new logging.Preferences()
  loggingPreferences.setLevel(logging.Type.BROWSER, logging.Level.DEBUG)

  driver = await require('./selenium-webdriver/' + options.browser)({
    seleniumWebdriver,
    settings,
    options,
    loggingPreferences
  })
}

require('./browser')({
  name: 'selenium-webdriver',

  options (command) {
    command
      .option('-b, --browser <name>', 'Browser driver', browser, 'chrome')
      .option('--visible [flag]', 'Show the browser', boolean, false)
      .option('-w, --viewport-width <width>', 'Viewport width', integer, 1920)
      .option('-h, --viewport-height <height>', 'Viewport height', integer, 1080)
      .option('-l, --language <lang...>', 'Language(s)', ['en-US'])
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
    if (!settings.modules) {
      return {
        modules: ['selenium-webdriver'],
        screenshot: '.png',
        traces: ['console', 'network'],
        'probe-with-modules': true
      }
    }
    await buildDriver(settings, options)
    return {
      modules: ['selenium-webdriver'],
      screenshot: '.png',
      scripts: true,
      traces: ['console', 'network']
    }
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
