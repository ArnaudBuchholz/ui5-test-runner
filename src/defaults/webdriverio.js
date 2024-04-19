'use strict'

let browserio

function browser (value) {
  if (value === undefined) {
    return 'chrome'
  }
  if (!['chrome', 'firefox'].includes(value)) {
    throw new InvalidArgumentError('Browser name')
  }
  return value
}

require('./browser')({
  metadata: {
    name: 'webdriverio',
    options: [
      ['--visible [flag]', 'Show the browser', false],
      ['-b, --browser <name>', 'Browser driver', browser, 'chrome'],
    ]
  },

  async capabilities ({ settings, options }) {
    return {
      modules: ['webdriverio'],
      screenshot: '.png',
      scripts: true,
      traces: []
    }
  },

  async screenshot ({ filename }) {
    if (browserio) {
      await browserio.saveScreenshot(filename)
      return true
    }
  },

  async beforeExit () {
    if (browserio) {
      await browserio.deleteSession()
    }
  },

  async run ({
    settings: { url, scripts, modules },
    options,
    consoleWriter,
    networkWriter
  }) {
    const { remote } = require(modules.webdriverio)

    const capabilities = {
      chrome: {
        browserName: 'chrome',
        webSocketUrl: true,
        'goog:chromeOptions': {
          args: options.visible ? [] : ['headless', 'disable-gpu']
        }
      },
      firefox: {
        browserName: 'firefox',
        webSocketUrl: true,
        'moz:firefoxOptions': {
          args: options.visible ? [] : ['-headless']
        }
      }
    }

    browserio = await remote({
      capabilities: capabilities[options.browser]
    })

    if (scripts && scripts.length) {
      for (const script of scripts) {
        await browserio.scriptAddPreloadScript({
          functionDeclaration: `() => ${script}`
        })
      }
    }

    await browserio.url(url)
  }
})
