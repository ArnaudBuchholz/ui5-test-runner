const { readFile, writeFile } = require('fs/promises')
const { join } = require('path')
const { Command, InvalidArgumentError } = require('commander')
const { buildCsvWriter } = require('../csv-writer')
const { any, arrayOf, boolean, integer, string } = require('../options')

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
  metadata.options
    .map(option => {
      if (option[0] === 'browser') {
        const [, ...browsers] = option
        return [[
          '-b, --browser <name>', 'Browser driver',
          function (value) {
            if (value === undefined) {
              return browsers[0]
            }
            if (!browsers.includes(value)) {
              throw new InvalidArgumentError('Browser name')
            }
            return value
          },
          browsers[0]
        ]]
      }
      if (option === 'binary') {
        return [['--binary <binary>', 'Binary path']]
      }
      if (option === 'visible') {
        return [['--visible [flag]', 'Show the browser', false]]
      }
      if (option === 'viewport') {
        return [
          ['-w, --viewport-width <width>', 'Viewport width', 1920],
          ['-h, --viewport-height <height>', 'Viewport height', 1080]
        ]
      }
      if (option === 'language') {
        return [['-l, --language <lang...>', 'Language(s)', arrayOf(string, true), ['en-US']]]
      }
      if (option === 'unsecure') {
        return [['-u, --unsecure', 'Disable security features', false]]
      }
      return [option]
    })
    .flat()
    .forEach(([label, description, parser, defaultValue]) => {
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

  if (process.argv[2] === 'test') {
    command.parse(process.argv.slice(3), { from: 'user' })
    console.log(command.opts(), command.args)
    return exit(0)
  }

  if (process.argv.length !== 3) {
    command.outputHelp()
    return exit(0)
  }

  async function main () {
    settings = JSON.parse((await readFile(process.argv[2])).toString())
    command.parse(settings.args, { from: 'user' })
    options = command.opts()

    options.chromeArgs = function () {
      const args = [
        'true', // Not sure why but this changes the behavior of the browser
        '--start-maximized',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-extensions',
        '--log-level=3',
        `--window-size=${options.viewportWidth},${options.viewportHeight}`,
        `--lang=${options.language.join(',')}`
      ]
      if (!options.visible) {
        args.push('--headless=new')
      }
      if (options.unsecure) {
        args.push(
          '--ignore-certificate-errors',
          '--disable-web-security',
          '--disable-features=IsolateOrigins',
          '--disable-features=BlockInsecurePrivateNetworkRequests',
          '--disable-site-isolation-trials'
        )
      }
      return args.concat(command.args)
    }

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
