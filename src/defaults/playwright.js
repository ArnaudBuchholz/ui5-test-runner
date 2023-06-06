'use strict'

const { InvalidArgumentError } = require('commander')

let browser
let context
let page

function browserSelector (value, defaultValue) {
  if (value === undefined) {
    return 'chromium'
  }
  if (!['chromium', 'firefox', 'webkit'].includes(value)) {
    throw new InvalidArgumentError('Browser name')
  }
  return value
}

require('./browser')({
  metadata: {
    name: 'playwright',
    options: [
      ['-b, --browser <name>', 'Browser driver', browserSelector, 'chromium'],
      ['--visible [flag]', 'Show the browser', false],
      // tracing => .zip
      // video => 
      // ['-w, --viewport-width <width>', 'Viewport width', 1920],
      // ['-h, --viewport-height <height>', 'Viewport height', 1080],
      // ['-l, --language <lang...>', 'Language(s)', ['en-US']],
      // ['-u, --unsecure', 'Disable security features', false]
    ],
    capabilities: {
      modules: ['playwright'],
      screenshot: '.png',
      scripts: true,
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
    const browsers = require(modules.playwright)
    browser = await browsers[options.browser].launch()
    context = await browser.newContext({

    })

    context.setDefaultNavigationTimeout(0)

    if (scripts && scripts.length) {
      for (const content of scripts) {
        await context.addInitScript({ content })
      }
    }

    page = await context.newPage()

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

    await page.goto(url)
  }
})
