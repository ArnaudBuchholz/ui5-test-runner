'use strict'

const param = process.argv[2]

if (param === 'capabilities') {
  console.log(JSON.stringify({
    modules: ['selenium-webdriver']
  }))
  process.exit(0)
}

const { readFileSync } = require('fs')
const settings = JSON.parse(readFileSync(param).toString())
const { Builder, Browser } = require(settings.modules['selenium-webdriver'])

const { url } = settings

let driver

process.on('message', async message => {
  try {
    if (message.command === 'stop') {
      await driver.quit()
      process.exit(0)
    }
  } catch (e) {
    console.error(e)
    process.exit(-2)
  }
})

async function main () {
  driver = await new Builder().forBrowser(Browser.CHROME).build()
  await driver.get(url)
}

main().catch(e => {
  console.error(e)
  process.exit(-1)
})
