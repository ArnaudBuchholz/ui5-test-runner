const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')
const { execFile } = require('child_process')
const { getCommand } = require('../src/job.js')

const [node] = process.argv

async function usage () {
  const usagePath = join(__dirname, '../docs/usage.md')
  const usageMd = (await readFile(usagePath)).toString()
  const command = getCommand(process.cwd())
  const help = command.helpInformation()
  const [, reducedHelp] = help.match(/Options:\r?\n((?:.|\r?\n)*)/m)
  await writeFile(usagePath, usageMd
    .replace(/```text(?:.|\r?\n)*```/, '```text\n' + reducedHelp + '```')
    .replace(/\r\n/g, '\n')
  )
}

async function browser (name) {
  const browserDocPath = join(__dirname, `../docs/${name}.md`)
  const browserDoc = (await readFile(browserDocPath)).toString().replace(/\r\n/g, '\n')
  const { stdout } = await new Promise(resolve =>
    execFile(
      node,
      [join(__dirname, `../src/defaults/${name}.js`)],
      (error, stdout, stderr) => resolve({ error, stdout, stderr })
    )
  )
  const [, reducedHelp] = stdout.match(/Options:\n((?:.|\n)*)/m)
  const newBrowserDoc = browserDoc.replace(/## Options[^#]+/, '## Options\n```text\n' + reducedHelp + '```\n\n')
  if (browserDoc !== newBrowserDoc) {
    await writeFile(browserDocPath, newBrowserDoc)
  }
}

async function main () {
  process.stdout.columns = 120
  await Promise.all([
    usage(),
    browser('puppeteer'),
    browser('playwright'),
    browser('selenium-webdriver'),
    browser('jsdom'),
    browser('webdriverio')
  ])
}

main()
