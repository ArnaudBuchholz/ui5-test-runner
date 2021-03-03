'use strict'
const puppeteer = require('puppeteer')
const url = process.argv[2]

let browser

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
}

main()
