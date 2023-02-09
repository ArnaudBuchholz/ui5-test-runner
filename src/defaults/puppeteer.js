'use strict'

const { boolean, integer } = require('../options')

let browser
let page

require('./browser')({
  name: 'puppeteer',

  options (command) {
    command
      .option('--visible [flag]', 'Show the browser', boolean, false)
      .option('-w, --viewport-width <width>', 'Viewport width', integer, 1920)
      .option('-h, --viewport-height <height>', 'Viewport height', integer, 1080)
      .option('-l, --language <lang...>', 'Language(s)', ['en-US'])
  },

  async screenshot (filename) {
    if (page) {
      await page.screenshot({
        path: filename,
        fullPage: true
      })
      return true
    }
    return false
  },

  async beforeExit () {
    if (page) {
      await page.close()
    }
    if (browser) {
      await browser.close()
    }
  },

  capabilities () {
    return {
      modules: ['puppeteer'],
      screenshot: '.png',
      scripts: true,
      traces: ['console', 'network']
    }
  },

  async run ({
    settings: { url, scripts, modules },
    options,
    consoleWriter,
    networkWriter
  }) {
    const puppeteer = require(modules.puppeteer)

    browser = await puppeteer.launch({
      headless: !options.visible,
      defaultViewport: null,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-extensions',
        `--window-size=${options.viewportWidth},${options.viewportHeight}`,
        `--lang=${options.language.join(',')}`
      ]
    })

    page = (await browser.pages())[0]

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
      for await (const script of scripts) {
        await page.evaluateOnNewDocument(script)
      }
    }

    await page.setDefaultNavigationTimeout(0)
    await page.goto(url)
  },

  async error (e, exit) {
    // Lots of threads on this message but no clear solution
    if (e.message === 'Navigation failed because browser has disconnected!') {
      await exit(0)
    }
  }
})
