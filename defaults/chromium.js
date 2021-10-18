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
  if (message.command === 'stop') {
    if (reportDir && page) {
      await page.screenshot({ path: join(reportDir, 'screenshot.png') })
    }
    await browser.close()
    process.exit(0)
  } else if (message.command === 'screenshot') {
    if (reportDir && page) {
      // const { filename } = message
      // console.log('>', filename)
      // console.time(filename)
      await page.screenshot({ path: join(reportDir, message.filename) })
      // console.timeEnd(filename)
      // console.log('<', filename)
      process.send(message)
    }
  }
})

async function main () {
  browser = await puppeteer.launch({
    headless,
    args: [
      url,
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
