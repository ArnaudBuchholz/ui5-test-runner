'use strict'

const puppeteer = require('puppeteer')
const { join } = require('path')
const { createWriteStream } = require('fs')

const url = process.argv[2]
const reportDir = process.argv[3]

let browser
let consoleStream

if (reportDir) {
  consoleStream = createWriteStream(join(reportDir, 'console.txt'), 'utf-8')
}

process.on('message', async message => {
  if (message.command === 'stop') {
    await browser.close()
    process.exit(0)
  }
})

async function main () {
  browser = await puppeteer.launch({
    headless: true,
    args: [
      url,
      '--no-sandbox',
      '--disable-gpu',
      '--disable-extensions'
    ]
  })
  if (consoleStream) {
    const page = (await browser.pages())[0]
    page.on('console', message => consoleStream.write(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}\n`))
  }
}

main()
