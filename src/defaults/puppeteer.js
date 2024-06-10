'use strict'

let browser
let page

require('./browser')({
  metadata: {
    name: 'puppeteer',
    options: [
      'visible',
      ['--firefox [flag]', 'Use firefox instead of chrome', false],
      'binary',
      'viewport',
      'language',
      'unsecure',
      ['--basic-auth-username <username>', 'Username for basic authentication', ''],
      ['--basic-auth-password <password>', 'Password for basic authentication', '']
    ]
  },

  async capabilities ({ settings, options }) {
    return {
      modules: ['puppeteer'],
      screenshot: '.png',
      scripts: !options.firefox,
      traces: ['console', 'network']
    }
  },

  async screenshot ({ filename }) {
    if (page) {
      await page.screenshot({
        path: filename,
        fullPage: true
      })
      return true
    }
  },

  async beforeExit () {
    if (page) {
      await page.close()
    }
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
    const puppeteer = require(modules.puppeteer)

    let args = []
    let product
    if (options.firefox) {
      product = 'firefox'
    } else {
      args = options.chromeArgs()
    }

    browser = await puppeteer.launch({
      product,
      executablePath: options.binary,
      headless: options.visible ? false : 'new',
      defaultViewport: null,
      args
    })

    page = (await browser.pages())[0]

    if (options.unsecure) {
      await page.setBypassCSP(true)
    }

    if (options.basicAuthUsername || options.basicAuthPassword) {
      await page.authenticate({ username: options.basicAuthUsername, password: options.basicAuthPassword })
    }

    page
      .on('console', message => consoleWriter.append({
        type: message.type(),
        text: message.text()
      }))
      .on('response', response => {
        const request = response.request()
        networkWriter.append({
          method: request.method(),
          url: response.url(),
          status: response.status()
        })
      })

    if (scripts && scripts.length) {
      for (const script of scripts) {
        await page.evaluateOnNewDocument(script)
      }
    }

    await page.setDefaultNavigationTimeout(0)
    await page.goto(url)
  },

  async error ({ error: e, exit }) {
    // Lots of threads on this message but no clear solution
    if (e.message === 'Navigation failed because browser has disconnected!') {
      await exit(0)
    }
  }
})
