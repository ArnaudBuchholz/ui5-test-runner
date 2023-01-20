'use strict'

const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')
const { Command } = require('commander')
const { boolean, integer } = require('../options')
const { buildCsvWriter } = require('../csv-writer')

const command = new Command()
command
  .name('ui5-test-runner/@/puppeteer')
  .description('Browser instantiation command for puppeteer')
  .helpOption(false)
  .option('--visible [flag]', 'Show the browser', boolean, false)
  .option('-w, --viewport-width <width>', 'Viewport width', integer, 1920)
  .option('-h, --viewport-height <height>', 'Viewport height', integer, 1080)

let consoleWriter = { ready: Promise.resolve() }
let networkWriter = { ready: Promise.resolve() }

let browser
let page
let stopping = false

async function exit (code) {
  if (stopping) {
    return
  }
  stopping = true
  await Promise.all([consoleWriter.ready, networkWriter.ready])
  if (page) {
    await page.close()
  }
  if (browser) {
    await browser.close()
  }
  process.exit(0)
}

process.on('message', async message => {
  const { command } = message
  try {
    if (command === 'stop') {
      await exit(0)
    } else if (command === 'screenshot') {
      if (page) {
        await page.screenshot({
          path: message.filename,
          fullPage: true
        })
        process.send(message)
      } else {
        throw new Error('screenshot command received but page not ready')
      }
    }
  } catch (e) {
    console.error(e)
    exit(-2)
  }
})

async function main () {
  if (process.argv.length !== 3) {
    command.outputHelp()
    return exit(0)
  }

  const settings = JSON.parse((await readFile(process.argv[2])).toString())
  command.parse(settings.args, { from: 'user' })
  const options = command.opts()

  if (settings.capabilities) {
    await writeFile(settings.capabilities, JSON.stringify({
      modules: ['puppeteer'],
      screenshot: '.png',
      scripts: true,
      traces: ['console', 'network']
    }))
    return exit(0)
  }

  const puppeteer = require(settings.modules.puppeteer)

  const { url, scripts, dir } = settings

  browser = await puppeteer.launch({
    headless: !options.visible,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-extensions',
      `--window-size=${options.viewportWidth},${options.viewportHeight}`
    ]
  })
  page = (await browser.pages())[0]

  consoleWriter = buildCsvWriter(join(dir, 'console.csv'))
  networkWriter = buildCsvWriter(join(dir, 'network.csv'))

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
}

main()
  .catch(e => {
    // Lots of threads on this message but no clear solution
    if (!stopping || e.message !== 'Navigation failed because browser has disconnected!') {
      console.error(e)
      return exit(-1)
    }
    exit(0)
  })
