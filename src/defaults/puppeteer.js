'use strict'

const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')
const { Command } = require('commander')
const { boolean } = require('../options')

const append = (fileName, line) => writeFile(fileName, line + '\n', { flag: 'a+' })

const command = new Command()
command
  .name('ui5-test-runner/@/puppeteer')
  .description('Browser instantiation command for puppeteer')
  .helpOption(false)
  .option('--visible [flag]', 'Show the browser', boolean, false)

let consoleReady = Promise.resolve()
let networkReady = Promise.resolve()

let browser
let page
let stopping = false

async function exit (code) {
  stopping = true
  await Promise.all([consoleReady, networkReady])
  if (page) {
    try {
      await page.close()
    } catch (error) {
      // ignore
    }
  }
  if (browser) {
    try {
      await browser.close()
    } catch (error) {
      // ignore
    }
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
      traces: {
        console: true,
        network: true
      }
    }))
    return exit(0)
  }

  const puppeteer = require(settings.modules.puppeteer)

  const { url, scripts, dir } = settings

  browser = await puppeteer.launch({
    dumpio: true,
    headless: !options.visible,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-extensions'
    ]
  })
  page = (await browser.pages())[0]

  const consoleFilename = join(dir, 'console.txt')
  const networkFilename = join(dir, 'network.txt')

  page
    .on('console', message => {
      const t = Date.now()
      consoleReady = consoleReady
        .then(() => append(
          consoleFilename,
          `${t}\t${message.type()}\t${message.text().replace(/\r|\n|\t/g, match => ({ '\r': '\\r', '\n': '\\n', '\t': '\\t' }[match]))}`
        ))
        .catch(() => {})
    })
    .on('response', response => {
      const t = Date.now()
      const request = response.request()
      const method = request.method()
      networkReady = networkReady
        .then(() => append(
          networkFilename,
          `${t}\t${response.status()}\t${method}\t${response.url()}`
        ))
        .catch(() => {})
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
