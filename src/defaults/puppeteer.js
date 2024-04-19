'use strict'

let browser
let page

require('./browser')({
  metadata: {
    name: 'puppeteer',
    options: [
      ['--visible [flag]', 'Show the browser', false],
      ['--firefox [flag]', 'Use firefox instead of chrome', false],
      ['--binary <binary>', 'Binary path'],
      ['-w, --viewport-width <width>', 'Viewport width', 1920],
      ['-h, --viewport-height <height>', 'Viewport height', 1080],
      ['-l, --language <lang...>', 'Language(s)', ['en-US']],
      ['-u, --unsecure', 'Disable security features', false],
      ['--basic-auth-username <username>', 'Username for basic authentication', ''],
      ['--basic-auth-password <password>', 'Password for basic authentication', '']
    ],
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

    const args = [
      '--start-maximized',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-extensions',
      `--window-size=${options.viewportWidth},${options.viewportHeight}`,
      `--lang=${options.language.join(',')}`
    ]

    if (options.unsecure) {
      args.push(
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-features=BlockInsecurePrivateNetworkRequests',
        '--disable-site-isolation-trials'
      )
    }

    let product
    if (options.firefox) {
      product = 'firefox'
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
