'use strict'

const { join } = require('path')
const { exec } = require('child_process')

let browser
let context
let page

require('./browser')({
  metadata: {
    name: 'playwright',
    options: [
      ['browser', 'chromium', 'firefox', 'webkit'],
      'visible',
      'viewport',
      'language',
      'unsecure',
      ['-v, --video', 'Record video', false],
      ['-n, --har', 'Record network activity with har file', false]
    ]
  },

  async capabilities ({ settings, options }) {
    const capabilities = {
      modules: ['playwright'],
      screenshot: '.png',
      scripts: true,
      traces: ['console', 'network']
    }
    if (!settings.modules) {
      return {
        ...capabilities,
        'probe-with-modules': true
      }
    }
    return await new Promise((resolve, reject) => {
      exec('npx playwright install', (err, stdout, stderr) => {
        console.log(stdout)
        console.error(stderr)
        if (err) {
          reject(new Error('Unable to finalize playwright installation'))
        } else {
          resolve(capabilities)
        }
      })
    })
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
    browser = await browsers[options.browser].launch({
      headless: !options.visible
    })

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
      locale: options.language[0],
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
