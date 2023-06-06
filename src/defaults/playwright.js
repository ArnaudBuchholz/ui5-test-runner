'use strict'

const { InvalidArgumentError } = require('commander')
const { join } = require('path')

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
      ['-w, --viewport-width <width>', 'Viewport width', 1280],
      ['-h, --viewport-height <height>', 'Viewport height', 720],
      ['-l, --language <lang>', 'Language', 'en-US'],
      ['-u, --unsecure', 'Disable security features', false],
      ['-v, --video', 'Record video', false],
      ['-n, --har', 'Record network activity with har file', false]
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
    if (context) {
      await context.close()
    }
    if (browser) {
      await browser.close()
    }
  },

  async run ({
    settings: { url, scripts, modules, dir },
    options,
    consoleWriter,
    networkWriter
  }) {
    const browsers = require(modules.playwright)
    browser = await browsers[options.browser].launch()

    let recordVideo
    if (options.video) {
      recordVideo = {
        dir
      }
    }

    let recordHar
    if (options.har) {
      recordHar = {
        path: join(dir, 'network.har')
      }
    }

    context = await browser.newContext({
      viewport: {
        width: options.viewportWidth,
        height: options.viewportHeight
      },
      locale: options.language,
      bypassCSP: options.unsecure,
      ignoreHTTPSErrors: options.unsecure,
      recordVideo,
      recordHar
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
