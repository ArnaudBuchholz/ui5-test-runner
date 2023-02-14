'use strict'

const { InvalidArgumentError } = require('commander')
const { url } = require('../options')
const { writeFile } = require('fs/promises')

let logging
let driver

function browser (value, defaultValue) {
  if (value === undefined) {
    return 'chrome'
  }
  if (!['chrome', 'firefox', 'edge'].includes(value)) {
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
    loggingPreferences
  })
}

require('./browser')({
  metadata: {
    name: 'selenium-webdriver',
    options: [
      ['-b, --browser <name>', 'Browser driver', browser, 'chrome'],
      ['--visible [flag]', 'Show the browser', false],
      ['-s, --server <server>', 'Selenium server URL', url],
      ['--binary <binary>', 'Binary path']
    ]
  },

  async capabilities ({ settings, options }) {
    const capabilities = {
      modules: ['selenium-webdriver'],
      screenshot: '.png',
      scripts: false,
      traces: []
    }
    if (!settings.modules) {
      return {
        ...capabilities,
        'probe-with-modules': true
      }
    }
    await buildDriver(settings, options)
    if (driver.__console__) {
      capabilities.traces.push('console')
    }
    if (driver.__network__) {
      capabilities.traces.push('network')
    }
    if (driver.__addScript__) {
      capabilities.scripts = true
    }
    return capabilities
  },

  async screenshot ({ filename }) {
    if (driver) {
      const data = await driver.takeScreenshot()
      await writeFile(filename, data.replace(/^data:image\/png;base64,/, ''), {
        encoding: 'base64'
      })
      return true
    }
  },

  async flush ({
    settings,
    consoleWriter
  }) {
    if (driver && settings.capabilities.traces.includes('console')) {
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

  async run ({
    settings,
    options
  }) {
    await buildDriver(settings, options)

    const { url, scripts } = settings

    if (scripts && scripts.length) {
      for await (const script of scripts) {
        await driver.__addScript__(script)
      }
    }

    await driver.get(url)
  },

  async error ({ error: e }) {
    if (e.name === 'SessionNotCreatedError') {
      console.error(e.message)
    } else {
      console.error(e)
    }
    console.error('Please check https://www.npmjs.com/package/selenium-webdriver#installation for browser driver')
  }
})
