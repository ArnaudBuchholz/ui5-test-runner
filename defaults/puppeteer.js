'use strict'

const param = process.argv[2]

if (param === 'capabilities') {
  console.log(JSON.stringify({
    modules: ['puppeteer'],
    screenshot: true,
    console: true,
    scripts: true
  }))
  process.exit(0)
}

const { createWriteStream, readFileSync } = require('fs')
const settings = JSON.parse(readFileSync(param).toString())
console.log(settings)
const puppeteer = require(settings.modules.puppeteer)

const { url, scripts, consoleLog } = settings
const headless = !(settings.argv || []).some(arg => arg === '--visible')

let browser
let page

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
  const browser = await puppeteer.launch({
    headless,
    defaultViewport: null,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-extensions'
    ]
  })
  const page = (await browser.pages())[0]
  if (consoleLog) {
    const consoleStream = createWriteStream(consoleLog, 'utf-8')
    page.on('console', message => consoleStream.write(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}\n`))
  }
  if (scripts && scripts.length) {
    for await (const scriptName of scripts) {
      const script = readFileSync(scriptName).toString()
      await page.evaluateOnNewDocument(script)
    }
  }
  page.goto(url)
}

main().catch(e => {
  console.error(e)
  process.exit(-1)
})
