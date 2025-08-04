'use strict'

let browser
let page

console.time('⏲ run      ')

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
    console.timeEnd('⏲ run      ')
    console.time('⏲ require  ')
    const puppeteer = require(modules.puppeteer)
    console.timeEnd('⏲ require  ')

    let args = []
    let product
    if (options.firefox) {
      product = 'firefox'
    } else {
      args = options.chromeArgs()
    }

    console.time('⏲ launch   ')
    browser = await puppeteer.launch({
      product,
      executablePath: options.binary,
      headless: options.visible ? false : 'new',
      defaultViewport: null,
      args
    })
    console.timeEnd('⏲ launch   ')

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

    console.time('⏲ scripts  ')
    if (scripts && scripts.length) {
      for (const script of scripts) {
        await page.evaluateOnNewDocument(script)
      }
    }
    console.timeEnd('⏲ scripts  ')

    await page.setDefaultNavigationTimeout(0)
    console.time('⏲ navigate ')
    await page.goto(url)
    console.timeEnd('⏲ navigate ')
  },

  async error ({ error: e, exit }) {
    // Lots of threads on this message but no clear solution
    if (e.message === 'Navigation failed because browser has disconnected!') {
      await exit(0)
    }
  }
})
