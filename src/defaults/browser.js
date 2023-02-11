const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')
const { Command } = require('commander')
const { buildCsvWriter } = require('../csv-writer')

const noop = () => { }

module.exports = ({
  name,
  options,
  flush = noop,
  beforeExit = noop,
  screenshot,
  capabilities,
  run,
  error = noop
}) => {
  const command = new Command()
  command
    .name(`ui5-test-runner/@/${name}`)
    .description(`Browser instantiation command for ${name}`)
    .helpOption(false)
  options(command)

  const append = () => { }
  let consoleWriter = { ready: Promise.resolve(), append }
  let networkWriter = { ready: Promise.resolve(), append }

  let stopping = false

  async function exit (code) {
    if (stopping) {
      return
    }
    stopping = true
    try {
      await flush({
        consoleWriter,
        networkWriter
      })
    } catch (e) {
      console.error('[exit:flush]', e)
      code = -3
    }
    await Promise.all([consoleWriter.ready, networkWriter.ready])
    try {
      await beforeExit()
    } catch (e) {
      console.error('[exit:beforeExit]', e)
      // but ignore
    }
    process.exit(code)
  }

  process.on('message', async message => {
    const { command } = message
    try {
      if (command === 'stop') {
        await exit(0)
      } else if (command === 'screenshot') {
        if (screenshot && await screenshot(message.filename)) {
          process.send(message)
        } else {
          throw new Error('screenshot command failed')
        }
      }
    } catch (e) {
      console.error(e)
      exit(-2)
    }
  })

  if (process.argv.length !== 3) {
    command.outputHelp()
    return exit(0)
  }

  async function main () {
    const settings = JSON.parse((await readFile(process.argv[2])).toString())
    command.parse(settings.args, { from: 'user' })
    const options = command.opts()

    if (settings.capabilities) {
      const attributes = await capabilities({ settings, options })
      await writeFile(settings.capabilities, JSON.stringify(attributes, undefined, 2))
      return exit(0)
    }

    consoleWriter = buildCsvWriter(join(settings.dir, 'console.csv'))
    networkWriter = buildCsvWriter(join(settings.dir, 'network.csv'))

    await run({
      settings,
      options,
      consoleWriter,
      networkWriter,
      exit
    })
  }

  main()
    .catch(async e => {
      if (!stopping) {
        await error(e)
        console.error(e)
      }
      exit(-1)
    })
}
