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
  const textLines = reducedHelp.split(/\r?\n/)

  const optionWidth = textLines[0].indexOf('output the version number')
  const arrayLines = textLines.reduce((result, line) => {
    const option = line.substring(0, optionWidth)
    const description = line.substring(optionWidth)
    if (option.trim()) {
      if (result.length) {
        let { description } = result.at(-1)
        const [, defaultValue] = description.match(/\(default: (.*)\)/) ?? []
        if (defaultValue) {
          result.at(-1).default = defaultValue.trim()
          description = description.substring(0, description.indexOf('(default:')).trim()
        }
        let [modes] = description.match(/\[(💻|🔗|🧪)+\]|🧪|🔗/) ?? []
        if (modes) {
          description = description.substring(modes.length).trim()
          if (modes.startsWith('[')) {
            modes = modes.substring(1, modes.length - 1)
          }
          result.at(-1).modes = modes
        }
        result.at(-1).description = description
      }
      result.push({
        option: option.trim(),
        description: description.trim()
      })
    } else {
      result.at(-1).description += ' ' + description.trim()
    }
    return result
  }, [])

  const forMd = (value) => value.replace(/\|/g, '\\|').replace(/</g, '\\<')

  await writeFile(usagePath, usageMd
    .replace(
      /\|-\|-\|-\|-\|(?:.|\r?\n)*\|\|\|\|\|/,
      '|-|-|-|-|\n' +
      arrayLines
        .map((line) => `|${forMd(line.option)}|${line.modes ?? ''}|${forMd(line.description)}|${line.default ? `\`${forMd(line.default)}\`` : ''}|`)
        .join('\n') + '\n|||||'
    )
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
  const newBrowserDoc = browserDoc.replace(/## Options\n\n?```[^`]+/, '## Options\n\n```text\n' + reducedHelp)
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
