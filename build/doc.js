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
  const [, reducedHelp] = help.match(/Options:\n((?:.|\n)*)/m)
  await writeFile(usagePath, usageMd.replace(/```text(?:.|\n)*```/, '```text\n' + reducedHelp + '```'))
}

async function browser (name) {
  const browserDocPath = join(__dirname, `../docs/${name}.md`)
  const browserDoc = (await readFile(browserDocPath)).toString()
  const { stdout } = await new Promise(resolve =>
    execFile(
      node,
      [join(__dirname, `../src/defaults/${name}.js`)],
      (error, stdout, stderr) => resolve({ error, stdout, stderr })
    )
  )
  const [, reducedHelp] = stdout.match(/Options:\n((?:.|\n)*)/m)
  await writeFile(browserDocPath, browserDoc.replace(/## Options[^#]+/, '## Options\n```text\n' + reducedHelp + '```\n\n'))
}

async function main () {
  process.stdout.columns = 120
  await Promise.all([
    usage(),
    browser('puppeteer'),
    browser('playwright'),
    browser('selenium-webdriver'),
    browser('jsdom')
  ])
}

main()
