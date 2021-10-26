'use strict'

const puppeteer = require('puppeteer')
const { join } = require('path')
const { createWriteStream } = require('fs')

const [url, reportDir] = process.argv.slice(2).filter(arg => !arg.startsWith('--'))
const headless = !process.argv.some(arg => arg === '--visible')

let browser
let page
let consoleStream

if (reportDir) {
  consoleStream = createWriteStream(join(reportDir, 'console.txt'), 'utf-8')
}

process.on('message', async message => {
  try {
    if (message.command === 'stop') {
      await browser.close()
      process.exit(0)
    } else if (message.command === 'screenshot') {
      if (reportDir && page) {
        await page.screenshot({ path: join(reportDir, message.filename) })
        process.send(message)
      }
    } else if (message.command === 'capabilities') {
      process.send({
        command: 'capabilities',
        screenshot: true,
        consoleLog: true
      })
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
