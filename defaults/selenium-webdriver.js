'use strict'

const { readFileSync, writeFileSync } = require('fs')
const settings = JSON.parse(readFileSync(process.argv[2]).toString())

if (settings.capabilities) {
  writeFileSync(settings.capabilities, JSON.stringify({
    modules: ['selenium-webdriver'],
    screenshot: '.png',
    scripts: true
  }))
  process.exit(0)
}

const { join } = require('path')
const { Builder, Browser } = require(settings.modules['selenium-webdriver'])
const { Options: ChromeOptions } = require(join(settings.modules['selenium-webdriver'], 'chrome'))

const chromeOptions = new ChromeOptions()
chromeOptions.excludeSwitches('enable-logging')

const { url, scripts } = settings

let driver

process.on('message', async message => {
  try {
    if (message.command === 'stop') {
      await driver.quit()
      process.exit(0)
    } else if (message.command === 'screenshot') {
      if (driver) {
        const data = await driver.takeScreenshot()
        writeFileSync(message.filename, data.replace(/^data:image\/png;base64,/, ''), {
          encoding: 'base64'
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
  driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(chromeOptions)
    .build()
  if (scripts && scripts.length) {
    for await (const script of scripts) {
      await driver.sendDevToolsCommand('Page.addScriptToEvaluateOnNewDocument', { source: script })
    }
  }
  await driver.get(url)
}

main().catch(async error => {
  console.error(error)
  try {
    await driver.quit()
  } catch (e) {
    // ignore
  }
  process.exit(-1)
})
