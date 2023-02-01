'use strict'

const { readFile, writeFile } = require('fs/promises')
const { Command } = require('commander')
// const { buildCsvWriter } = require('../csv-writer')

const command = new Command()
command
  .name('ui5-test-runner/@/jsdom')
  .description('Browser instantiation command for jsdom')
  .helpOption(false)

// let consoleWriter = { ready: Promise.resolve() }

process.on('message', async message => {
  const { command } = message
  if (command === 'stop') {
    process.exit(0)
  }
})

async function main () {
  if (process.argv.length !== 3) {
    command.outputHelp()
    process.exit(0)
  }

  const settings = JSON.parse((await readFile(process.argv[2])).toString())
  command.parse(settings.args, { from: 'user' })
  //   const options = command.opts()

  if (settings.capabilities) {
    await writeFile(settings.capabilities, JSON.stringify({
      modules: ['jsdom', 'axios'],
      traces: ['console']
    }))
    process.exit(0)
  }

  //   const { JSDOM } = require(settings.modules.jsdom)
  //   const axios = require(settings.modules.axios + '/dist/browser/axios.cjs')
  //   const { url, dir } = settings

  //   const dom = new JSDOM('', {
  //     url,
  //     contentType: 'text/html',
  //     runScripts: 'dangerously',
  //     resources: 'usable',
  //     pretendToBeVisual: true
  //   })

//   consoleWriter = buildCsvWriter(join(dir, 'console.csv'))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(-1)
  })
