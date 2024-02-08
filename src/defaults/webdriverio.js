'use strict'

let browser

require('./browser')({
  metadata: {
    name: 'webdriver.io',
    options: [
      ['--visible [flag]', 'Show the browser', false],
      ['-w, --viewport-width <width>', 'Viewport width', 1920],
      ['-h, --viewport-height <height>', 'Viewport height', 1080],
      ['-l, --language <lang...>', 'Language(s)', ['en-US']],
      ['-u, --unsecure', 'Disable security features', false],
      ['--basic-auth-username <username>', 'Username for basic authentication', ''],
      ['--basic-auth-password <password>', 'Password for basic authentication', '']
    ],
    capabilities: {
      modules: ['webdriverio'],
      screenshot: '.png'
    //   scripts: true,
    //   traces: ['console', 'network']
    }
  },

  async screenshot ({ filename }) {
    if (browser) {
      await browser.saveScreenshot(filename)
      return true
    }
  },

  async beforeExit () {
    if (browser) {
      await browser.close()
    }
  },

  async run ({
    settings: { url, scripts, modules },
    options,
    consoleWriter,
    networkWriter
  }) {
    console.log()
    const { remote } = require(modules.webdriverio)

    const browser = await remote({
      capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: !options.visible ? ['headless', 'disable-gpu'] : []
        }
      }
    })

    // page
    //   .on('console', message => consoleWriter.append({
    //     type: message.type(),
    //     text: message.text()
    //   }))
    //   .on('response', response => {
    //     const request = response.request()
    //     networkWriter.append({
    //       method: request.method(),
    //       url: response.url(),
    //       status: response.status()
    //     })
    //   })

    // if (scripts && scripts.length) {
    //   for (const script of scripts) {
    //     await page.evaluateOnNewDocument(script)
    //   }
    // }

    await browser.url(url)
  },

  async error ({ error: e, exit }) {
    // Lots of threads on this message but no clear solution
    if (e.message === 'Navigation failed because browser has disconnected!') {
      await exit(0)
    }
  }
})
