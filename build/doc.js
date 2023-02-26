const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')
const { getCommand } = require('../src/job.js')

async function main () {
  const usagePath = join(__dirname, '../docs/usage.md')
  const usageMd = (await readFile(usagePath)).toString()
  const command = getCommand(process.cwd())
  const help = command.helpInformation()
  const [, reducedHelp] = help.match(/Options:\n((?:.|\n)*)/m)
  await writeFile(usagePath, usageMd.replace(/```text(?:.|\n)*```/, '```text\n' + reducedHelp + '```'))
}

main()
