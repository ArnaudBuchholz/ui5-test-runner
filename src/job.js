'use strict'

const { Command, Option, InvalidArgumentError } = require('commander')
const { statSync, accessSync, constants } = require('fs')
const { join, isAbsolute } = require('path')
const { name, description, version } = require(join(__dirname, '../package.json'))
const { getOutput } = require('./output')
const { $valueSources } = require('./symbols')
const { buildAndCheckMode } = require('./job-mode')
const { boolean, integer, timeout, url, arrayOf } = require('./options')

const $status = Symbol('status')

function toLongName (name) {
  return name.replace(/([A-Z])([a-z]+)/g, (match, firstLetter, reminder) => `-${firstLetter.toLowerCase()}${reminder}`)
}

function buildArgs (parameters) {
  const before = []
  const after = []
  let browser = []
  Object.keys(parameters).forEach(name => {
    if (name === '--') {
      return
    }
    const value = parameters[name]
    let args
    if (name.startsWith('!')) {
      args = after
      name = name.substring(1)
    } else {
      args = before
    }
    args.push(`--${toLongName(name)}`)
    if (value !== null) {
      if (Array.isArray(value)) {
        args.push(...value)
      } else {
        args.push(value)
      }
    }
  })
  if (parameters['--']) {
    browser = parameters['--']
  }
  const stringify = args => args.map(value => value.toString())
  return {
    before: stringify(before),
    after: stringify(after),
    browser: stringify(browser)
  }
}

function lib (value) {
  if (value.includes('=')) {
    const [relative, source] = value.split('=')
    return { relative, source }
  } else {
    return { relative: '', source: value }
  }
}

function mapping (value) {
  try {
    const [, match, handler, mapping] = /([^=]*)=(file|url)\((.*)\)/.exec(value)
    return {
      match,
      [handler]: mapping
    }
  } catch (e) {
    throw new InvalidArgumentError('Invalid mapping')
  }
}

function getCommand (cwd) {
  const command = new Command()
  command.exitOverride()

  const DEBUG_OPTION = '(For debugging purpose)'

  command
    .name(name)
    .description(description)
    .version(version)

    .option('--capabilities', '🧪 Capabilities tester for browser')
    .option('-u, --url <url...>', '🔗 URL of the testsuite / page to test', arrayOf(url))

    // Common to all modes
    .addOption(
      new Option('-c, --cwd <path>', '[💻🔗🧪] Set working directory')
        .default(cwd, 'current working directory')
    )
    .option('--port <port>', '[💻🔗🧪] Port to use (0 to use any free one)', integer, 0)
    .option('-r, --report-dir <path>', '[💻🔗🧪] Directory to output test reports (relative to cwd)', 'report')
    .option('-pt, --page-timeout <timeout>', '[💻🔗🧪] Limit the page execution time, fails the page if it takes longer than the timeout (0 means no timeout)', timeout, 0)
    .option('-f, --fail-fast [flag]', '[💻🔗🧪] Stop the execution after the first failing page', boolean, false)
    .option('-k, --keep-alive [flag]', '[💻🔗🧪] Keep the server alive', boolean, false)
    .option('-l, --log-server [flag]', '[💻🔗🧪] Log inner server traces', boolean, false)
    .option('-p, --parallel <count>', '[💻🔗🧪] Number of parallel tests executions', 2)
    .option('-b, --browser <command>', '[💻🔗🧪] Browser instantiation command (relative to cwd or use $/ for provided ones)', '$/puppeteer.js')
    .option('--browser-args <argument...>', '[💻🔗🧪] Browser instantiation command parameters (use -- instead)')
    .option('--no-npm-install', '[💻🔗🧪] Prevent any NPM install (execution may fail if a dependency is missing)')
    .option('-bt, --browser-close-timeout <timeout>', '[💻🔗🧪] Maximum waiting time for browser close', timeout, 2000)
    .option('-br, --browser-retry <count>', '[💻🔗🧪] Browser instantiation retries : if the command fails unexpectedly, it is re-executed (0 means no retry)', 1)

    // Common to legacy and testing
    .option('-pf, --page-filter <regexp>', '[💻🔗] Filter out pages not matching the regexp')
    .option('-pp, --page-params <params>', '[💻🔗] Add parameters to page URL')
    .option('-t, --global-timeout <timeout>', '[💻🔗] Limit the pages execution time, fail the page if it takes longer than the timeout (0 means no timeout)', timeout, 0)
    .option('--screenshot [flag]', '[💻🔗] Take screenshots during the tests execution (if supported by the browser)', boolean, true)
    .option('--no-screenshot', '[💻🔗] Disable screenshots')
    .option('-st, --screenshot-timeout <timeout>', '[💻🔗] Maximum waiting time for browser screenshot', timeout, 5000)
    .option('-rg, --report-generator <path...>', '[💻🔗] Report generator paths (relative to cwd or use $/ for provided ones)', ['$/report.js'])
    .option('-pp, --progress-page <path>', '[💻🔗] progress page path (relative to cwd or use $/ for provided ones)', '$/report/default.html')

    // Specific to legacy
    .option('--ui5 <url>', '[💻] UI5 url', url, 'https://ui5.sap.com')
    .option('--libs <lib...>', '[💻] Library mapping (<relative>=<path> or <path>)', arrayOf(lib))
    .option('--mappings <mapping...>', '[💻] Custom mapping (<match>=<file|url>(<config>))', arrayOf(mapping))
    .option('--cache <path>', '[💻] Cache UI5 resources locally in the given folder (empty to disable)')
    .option('--webapp <path>', '[💻] Base folder of the web application (relative to cwd)', 'webapp')
    .option('--testsuite <path>', '[💻] Path of the testsuite file (relative to webapp)', 'test/testsuite.qunit.html')
    .option('-s, --serve-only [flag]', '[💻] Serve only', boolean, false)
    .option('-w, --watch [flag]', '[💻] Monitor the webapp folder and re-execute tests on change', boolean, false)
    .option('--coverage [flag]', '[💻] Enable or disable code coverage', boolean)
    .option('--no-coverage', '[💻] Disable code coverage')
    .option('-cs, --coverage-settings <path>', '[💻] Path to a custom nyc.json file providing settings for instrumentation (relative to cwd or use $/ for provided ones)', '$/nyc.json')
    .option('-ct, --coverage-temp-dir <path>', '[💻] Directory to output raw coverage information to (relative to cwd)', '.nyc_output')
    .option('-cr, --coverage-report-dir <path>', '[💻] Directory to store the coverage report files (relative to cwd)', 'coverage')
    .option('-cr, --coverage-reporters <reporter...>', '[💻] List of nyc reporters to use', ['lcov', 'cobertura'])

    .addOption(new Option('--debug-probe-only', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-keep-browser-open', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-memory', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-keep-report', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-capabilities-test <name>', DEBUG_OPTION).hideHelp())
    .addOption(new Option('--debug-capabilities-no-timeout', DEBUG_OPTION, boolean).hideHelp())

  return command
}

function parse (cwd, args) {
  const command = getCommand(cwd)

  command.parse(args, { from: 'user' })
  const options = command.opts()

  return Object.assign({
    initialCwd: cwd,
    browserArgs: command.args,
    [$valueSources]: Object.keys(options).reduce((valueSources, name) => {
      if (name !== 'browserArgs') {
        valueSources[name] = command.getOptionValueSource(name)
      }
      return valueSources
    }, {})
  }, options)
}

function checkAccess ({ path, label, file /*, write */ }) {
  try {
    const mode = constants.R_OK
    // if (write) {
    //   mode |= constants.W_OK
    // }
    accessSync(path, mode)
  } catch (error) {
    throw new Error(`Unable to access ${label}, check your settings`)
  }
  const stat = statSync(path)
  if (file) {
    if (!stat.isFile()) {
      throw new Error(`Unable to access ${label}, file expected`)
    }
  } else {
    if (!stat.isDirectory()) {
      throw new Error(`Unable to access ${label}, folder expected`)
    }
  }
}

function finalize (job) {
  function toAbsolute (path, from = job.cwd) {
    if (!isAbsolute(path)) {
      return join(from, path)
    }
    return path
  }

  function checkDefault (path) {
    if (path.startsWith('$/')) {
      return join(__dirname, './defaults', path.replace('$/', ''))
    }
    return path
  }

  function updateToAbsolute (member, from = job.cwd) {
    job[member] = toAbsolute(job[member], from)
  }
  'browser,coverageSettings,progressPage'
    .split(',')
    .forEach(setting => { job[setting] = checkDefault(job[setting]) })
  updateToAbsolute('cwd', job.initialCwd)
  'webapp,browser,reportDir,coverageSettings,coverageTempDir,coverageReportDir'
    .split(',')
    .forEach(setting => updateToAbsolute(setting))
  if (job.cache) {
    updateToAbsolute('cache')
  }
  job.mode = buildAndCheckMode(job)
  if (job.mode === 'legacy') {
    checkAccess({ path: job.webapp, label: 'webapp folder' })
    const testsuitePath = toAbsolute(job.testsuite, job.webapp)
    checkAccess({ path: testsuitePath, label: 'testsuite', file: true })
  } else if (job.mode === 'url') {
    if (job[$valueSources].coverage !== 'cli') {
      job.coverage = false
    }
  }
  checkAccess({ path: job.browser, label: 'browser command', file: true })
  job.reportGenerator = job.reportGenerator.map(setting => {
    const path = toAbsolute(checkDefault(setting), job.cwd)
    checkAccess({ path, label: 'report generator', file: true })
    return path
  })

  if (!job.libs) {
    job.libs = []
  } else {
    job.libs.forEach(libMapping => {
      libMapping.source = toAbsolute(libMapping.source)
      let description
      if (libMapping.relative) {
        description = `lib mapping of ${libMapping.relative}`
      } else {
        description = 'generic lib mapping'
      }
      checkAccess({ path: libMapping.source, label: `${description} (${libMapping.source})` })
    })
  }

  const output = getOutput(job)
  job[$status] = 'Starting'
  Object.defineProperty(job, 'status', {
    get () {
      return job[$status]
    },
    set (value) {
      job[$status] = value
      output.status(value)
    },
    enumerable: false,
    configurable: false
  })
}

function fromCmdLine (cwd, args) {
  let job = parse(cwd, args)

  const defaultPath = join(job.cwd, 'ui5-test-runner.json')
  let hasDefaultSettings = false
  try {
    checkAccess({ path: defaultPath, file: true })
    hasDefaultSettings = true
  } catch (e) {
    // ignore
  }
  if (hasDefaultSettings) {
    const defaults = require(defaultPath)
    const { before, after, browser } = buildArgs(defaults)
    const sep = args.indexOf('--')
    if (sep === -1) {
      args = [...before, ...args, ...after, '--', ...browser]
    } else {
      args = [...before, ...args.slice(0, sep), ...after, '--', ...browser, ...args.slice(sep + 1)]
    }
    job = parse(cwd, args)
  }

  finalize(job)
  return job
}

function fromObject (cwd, parameters) {
  const { before, browser } = buildArgs(parameters)
  if (browser.length) {
    return fromCmdLine(cwd, [...before, '--', ...browser])
  }
  return fromCmdLine(cwd, [...before])
}

module.exports = {
  getCommand,
  fromCmdLine,
  fromObject
}
