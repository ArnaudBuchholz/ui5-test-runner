const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')
const { Command } = require('commander')
const { buildCsvWriter } = require('../csv-writer')
const { any, boolean, integer } = require('../options')

const noop = () => { }

module.exports = ({
  metadata,
  flush = noop,
  beforeExit = noop,
  screenshot,
  capabilities: computeCapabilities,
  run,
  error = noop
}) => {
  const command = new Command()
  command
    .name(`ui5-test-runner/@/${metadata.name}`)
    .description(`Browser instantiation command for ${metadata.name}`)
    .helpOption(false)
  metadata.options.forEach(([label, description, parser, defaultValue]) => {
    if (defaultValue === undefined && typeof parser !== 'function') {
      defaultValue = parser
      if (typeof defaultValue === 'number') {
        parser = integer
      } else if (typeof defaultValue === 'boolean') {
        parser = boolean
      } else {
        parser = any
      }
    }
    command.option(label, description, parser, defaultValue)
  })

  const append = () => { }
  let consoleWriter = { ready: Promise.resolve(), append }
  let networkWriter = { ready: Promise.resolve(), append }

  let stopping = false
  let settings
  let options

  async function exit (code) {
    if (stopping) {
      return
    }
    stopping = true
    if (settings && typeof settings.capabilities !== 'string' && settings.capabilities.traces.length) {
      try {
        await flush({
          settings,
          options,
          consoleWriter,
          networkWriter
        })
      } catch (e) {
        console.error('[exit:flush]', e)
        code = -3
      }
      await Promise.all([consoleWriter.ready, networkWriter.ready])
    }
    try {
      await beforeExit({
        settings,
        options
      })
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
        if (settings.capabilities.screenshot && screenshot && await screenshot({
          settings,
          options,
          filename: message.filename
        })) {
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
    settings = JSON.parse((await readFile(process.argv[2])).toString())
    command.parse(settings.args, { from: 'user' })
    options = command.opts()

    if (typeof settings.capabilities === 'string') {
      let capabilities
      if (computeCapabilities !== undefined) {
        capabilities = await computeCapabilities({ settings, options })
      } else {
        capabilities = metadata.capabilities
      }
      await writeFile(settings.capabilities, JSON.stringify(capabilities, undefined, 2))
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
        await error({
          settings,
          options,
          error: e,
          exit
        })
        console.error(e)
      }
      exit(-1)
    })
}
