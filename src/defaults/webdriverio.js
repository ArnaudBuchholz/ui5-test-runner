'use strict'

let browserio

require('./browser')({
  metadata: {
    name: 'webdriverio',
    options: [
      'visible',
      ['browser', 'chrome', 'firefox'],
      'binary',
      'viewport',
      'language',
      'unsecure'
    ]
  },

  async capabilities ({ settings, options }) {
    return {
      modules: ['webdriverio'],
      // screenshot: '.png', // TODO: https://github.com/webdriverio/webdriverio/issues/14108
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

    const [browserOptions, args] = {
      chrome: [
        'goog:chromeOptions',
        options.chromeArgs()
      ],
      firefox: [
        'moz:firefoxOptions',
        options.visible ? [] : ['-headless']
      ]
    }[options.browser]

    browserio = await remote({
      capabilities: {
        browserName: options.browser,
        webSocketUrl: true,
        [browserOptions]: {
          args,
          binary: options.binary
        }
      }
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
