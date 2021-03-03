'use strict'
const puppeteer = require('puppeteer')
const url = process.argv[2]

let browser

process.on('beforeExit', () => browser.close())

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
