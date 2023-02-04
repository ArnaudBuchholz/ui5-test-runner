const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')
const { Command } = require('commander')
const { boolean } = require('../options')
const { buildCsvWriter } = require('../csv-writer')
const {
  $networkWriter
} = require('./jsdom/symbols')

const command = new Command()
command
  .name('ui5-test-runner/@/jsdom')
  .description('Browser instantiation command for jsdom')
  .helpOption(false)
  .option('--debug [flag]', 'Enable more traces', boolean, false)

let consoleWriter = { ready: Promise.resolve() }
let networkWriter = { ready: Promise.resolve() }

let stopping = false

async function exit (code) {
  if (stopping) {
    return
  }
  stopping = true
  await Promise.all([consoleWriter.ready, networkWriter.ready])
  process.exit(0)
}

process.on('message', async message => {
  const { command } = message
  if (command === 'stop') {
    return exit(0)
  }
})

async function main () {
  if (process.argv.length !== 3) {
    command.outputHelp()
    return exit(0)
  }

  const settings = JSON.parse((await readFile(process.argv[2])).toString())
  command.parse(settings.args, { from: 'user' })
  const options = command.opts()

  if (settings.capabilities) {
    await writeFile(settings.capabilities, JSON.stringify({
      modules: ['jsdom'],
      traces: ['console'],
      scripts: true
    }))
    return exit(0)
  }

  const { url, dir, scripts } = settings

  consoleWriter = buildCsvWriter(join(dir, 'console.csv'))
  networkWriter = buildCsvWriter(join(dir, 'network.csv'))

  const { JSDOM, VirtualConsole, ResourceLoader } = require(settings.modules.jsdom)

  const virtualConsole = new VirtualConsole()
  virtualConsole.on('error', (...args) => consoleWriter.append({ type: 'error', text: args.join(' ') }))
  virtualConsole.on('warn', (...args) => consoleWriter.append({ type: 'warning', text: args.join(' ') }))
  virtualConsole.on('info', (...args) => consoleWriter.append({ type: 'info', text: args.join(' ') }))
  virtualConsole.on('log', (...args) => consoleWriter.append({ type: 'log', text: args.join(' ') }))

  class CustomResourceLoader extends ResourceLoader {
    fetch (url, options) {
      networkWriter.append({
        method: 'GET',
        url,
        status: 'UNK'
      })
      return super.fetch(url, options)
    }
  }

  JSDOM.fromURL(url, {
    includeNodeLocations: true,
    storageQuota: 10000000,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    resources: new CustomResourceLoader(),
    beforeParse (window) {
      window[$networkWriter] = networkWriter
      require('./jsdom/compatibility')(window)
      if (options.debug) {
        require('./jsdom/debug')(window)
      }
      scripts.forEach(script => window.eval(script))
    }
  })
}

main()
  .catch(e => {
    console.error(e)
    exit(-1)
  })
