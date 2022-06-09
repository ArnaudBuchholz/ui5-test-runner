'use strict'

const param = process.argv[2]

if (param === 'capabilities') {
  console.log(JSON.stringify({
    modules: ['puppeteer'],
    screenshot: true,
    consoleLog: true
  }))
  process.exit(0)
}

const { createWriteStream, readFileSync } = require('fs')
const settings = JSON.parse(readFileSync(param).toString())
console.log(settings)
const puppeteer = require(settings.modules.puppeteer)

const { url, consoleLog } = settings
const headless = !(settings.argv || []).some(arg => arg === '--visible')

let browser
let page
let consoleStream

if (consoleLog) {
  consoleStream = createWriteStream(consoleLog, 'utf-8')
}

process.on('message', async message => {
  try {
    if (message.command === 'stop') {
      await browser.close()
      process.exit(0)
    } else if (message.command === 'screenshot') {
      if (page) {
        await page.screenshot({ path: message.filename })
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
      url,
      '--start-maximized',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-extensions'
    ]
  })
  page = (await browser.pages())[0]
  if (consoleStream) {
    page.on('console', message => consoleStream.write(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}\n`))
  }
}

main().catch(e => {
  console.error(e)
  process.exit(-1)
})
