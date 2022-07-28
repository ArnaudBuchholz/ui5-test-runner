'use strict'

const { createWriteStream, readFileSync, writeFileSync } = require('fs')
const settings = JSON.parse(readFileSync(process.argv[2]).toString())

if (settings.capabilities) {
  writeFileSync(settings.capabilities, JSON.stringify({
    modules: ['puppeteer'],
    screenshot: '.png',
    console: true,
    scripts: true
  }))
  process.exit(0)
}

const puppeteer = require(settings.modules.puppeteer)

const { url, scripts, consoleLog } = settings
const headless = !(settings.args || []).some(arg => arg === '--visible')

let browser
let page
let stopping = false

process.on('message', async message => {
  try {
    if (message.command === 'stop') {
      stopping = true
      await page.close()
      await browser.close()
      process.exit(0)
    } else if (message.command === 'screenshot') {
      if (page) {
        await page.screenshot({
          path: message.filename,
          fullPage: true
        })
        process.send(message)
      }
    }
  } catch (e) {
    console.error(e)
    process.exit(-2)
  }
})

async function main () {
  browser = await puppeteer.launch({
    headless,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-extensions'
    ]
  })
  page = (await browser.pages())[0]
  if (consoleLog) {
    const consoleStream = createWriteStream(consoleLog, 'utf-8')
    page.on('console', message => consoleStream.write(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}\n`))
  }
  if (scripts && scripts.length) {
    for await (const script of scripts) {
      await page.evaluateOnNewDocument(script)
    }
  }
  await page.goto(url)
}

main().catch(e => {
  // Lots of threads on this message but no clear solution
  if (!stopping || e.message !== 'Navigation failed because browser has disconnected!') {
    console.error(e)
    process.exit(-1)
  }
  process.exit(0)
})
