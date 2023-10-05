'use strict'

const { Command, Option, InvalidArgumentError } = require('commander')
const { statSync, accessSync, constants } = require('fs')
const { dirname, join, isAbsolute } = require('path')
const { name, description, version } = require(join(__dirname, '../package.json'))
const { getOutput } = require('./output')
const { $valueSources, $remoteOnLegacy } = require('./symbols')
const { buildAndCheckMode } = require('./job-mode')
const { boolean, integer, timeout, url, arrayOf, regex, percent } = require('./options')

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

  const DEBUG_OPTION = '(🐞 for debugging purpose)'
  const EXPERIMENTAL_OPTION = '[⚠️ experimental]'

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
    .option('-fo, --fail-opa-fast [flag]', '[💻🔗] Stop the OPA page execution after the first failing test', boolean, false)
    .option('-k, --keep-alive [flag]', '[💻🔗🧪] Keep the server alive', boolean, false)
    .option('-l, --log-server [flag]', '[💻🔗🧪] Log inner server traces', boolean, false)
    .option('-p, --parallel <count>', '[💻🔗🧪] Number of parallel tests executions', 2)
    .option('-b, --browser <command>', '[💻🔗🧪] Browser instantiation command (relative to cwd or use $/ for provided ones)', '$/puppeteer.js')
    .option('--browser-args <argument...>', '[💻🔗🧪] Browser instantiation command parameters (use -- instead)')
    .option('--no-npm-install', '[💻🔗🧪] Prevent any NPM install (execution may fail if a dependency is missing)')
    .option('-bt, --browser-close-timeout <timeout>', '[💻🔗🧪] Maximum waiting time for browser close', timeout, 2000)
    .option('-br, --browser-retry <count>', '[💻🔗🧪] Browser instantiation retries : if the command fails unexpectedly, it is re-executed (0 means no retry)', 1)

    // Common to legacy and url
    .option('-qs, --qunit-strict', '[💻🔗] Strict mode on qunit execution (fails if no modules declared)', boolean, false)
    .option('-pf, --page-filter <regexp>', '[💻🔗] Filter out pages not matching the regexp')
    .option('-pp, --page-params <params>', '[💻🔗] Add parameters to page URL')
    .option('-t, --global-timeout <timeout>', '[💻🔗] Limit the pages execution time, fail the page if it takes longer than the timeout (0 means no timeout)', timeout, 0)
    .option('--screenshot [flag]', '[💻🔗] Take screenshots during the tests execution (if supported by the browser)', boolean, true)
    .option('--no-screenshot', '[💻🔗] Disable screenshots')
    .option('-st, --screenshot-timeout <timeout>', '[💻🔗] Maximum waiting time for browser screenshot', timeout, 5000)
    .option('-rg, --report-generator <path...>', '[💻🔗] Report generator paths (relative to cwd or use $/ for provided ones)', ['$/report.js'])
    .option('-pp, --progress-page <path>', '[💻🔗] progress page path (relative to cwd or use $/ for provided ones)', '$/report/default.html')

    .option('--coverage [flag]', '[💻🔗] Enable or disable code coverage', boolean)
    .option('--no-coverage', '[💻🔗] Disable code coverage')
    .option('-cs, --coverage-settings <path>', '[💻🔗] Path to a custom nyc.json file providing settings for instrumentation (relative to cwd or use $/ for provided ones)', '$/nyc.json')
    .option('-ctd, --coverage-temp-dir <path>', '[💻🔗] Directory to output raw coverage information to (relative to cwd)', '.nyc_output')
    .option('-crd, --coverage-report-dir <path>', '[💻🔗] Directory to store the coverage report files (relative to cwd)', 'coverage')
    .option('-cr, --coverage-reporters <reporter...>', '[💻🔗] List of nyc reporters to use (text is always used)', ['lcov', 'cobertura'])
    .option('-ccb, --coverage-check-branches <percent>', '[💻🔗] What % of branches must be covered', percent, 0)
    .option('-ccf, --coverage-check-functions <percent>', '[💻🔗] What % of functions must be covered', percent, 0)
    .option('-ccl, --coverage-check-lines <percent>', '[💻🔗] What % of lines must be covered', percent, 0)
    .option('-ccs, --coverage-check-statements <percent>', '[💻🔗] What % of statements must be covered', percent, 0)
    .option('-s, --serve-only [flag]', '[💻🔗] Serve only', boolean, false)

    // Specific to legacy (and might be used with url if pointing to local project)
    .option('--ui5 <url>', '[💻] UI5 url', url, 'https://ui5.sap.com')
    .option('--disable-ui5', '[💻] Disable UI5 mapping (also disable libs)', boolean, false)
    .option('--libs <lib...>', '[💻] Library mapping (<relative>=<path> or <path>)', arrayOf(lib))
    .option('--mappings <mapping...>', '[💻] Custom mapping (<match>=<file|url>(<config>))', arrayOf(mapping))
    .option('--cache <path>', '[💻] Cache UI5 resources locally in the given folder (empty to disable)')
    .option('--webapp <path>', '[💻] Base folder of the web application (relative to cwd)', 'webapp')
    .option('--testsuite <path>', '[💻] Path of the testsuite file (relative to webapp)', 'test/testsuite.qunit.html')
    .option('-w, --watch [flag]', '[💻] Monitor the webapp folder and re-execute tests on change', boolean, false)

    // Specific to coverage in url mode (experimental)
    .option('-cp, --coverage-proxy [flag]', `[🔗] ${EXPERIMENTAL_OPTION} use internal proxy to instrument remote files`, boolean, false)
    .option('-cpi, --coverage-proxy-include <regexp>', `[🔗] ${EXPERIMENTAL_OPTION} urls to instrument for coverage`, regex, regex('.*'))
    .option('-cpe, --coverage-proxy-exclude <regexp>', `[🔗] ${EXPERIMENTAL_OPTION} urls to ignore for coverage`, regex, regex('/((test-)?resources|tests?)/.*'))

    .addOption(new Option('--debug-probe-only', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-keep-browser-open', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-memory', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-keep-report', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-capabilities-test <name>', DEBUG_OPTION).hideHelp())
    .addOption(new Option('--debug-capabilities-no-timeout', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-coverage', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-coverage-no-custom-fs', DEBUG_OPTION, boolean).hideHelp())

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

  if (job.coverage) {
    function overrideIfNotSet (option, valueFromSettings) {
      if (valueFromSettings && job[$valueSources][option] !== 'cli') {
        if (job.debugCoverage) {
          output.wrap(() => console.log(`${option} extracted from nyc settings : ${valueFromSettings}`))
        }
        job[option] = valueFromSettings
      }
    }

    function overrideDirIfNotSet (option, valueFromSettings) {
      if (valueFromSettings && !isAbsolute(valueFromSettings)) {
        valueFromSettings = join(dirname(job.coverageSettings), valueFromSettings)
      }
      overrideIfNotSet(option, valueFromSettings)
    }

    checkAccess({ path: job.coverageSettings, file: true, label: 'coverage settings' })

    let settings
    try {
      settings = require(job.coverageSettings)
    } catch (e) {
      throw new Error(`Unable to read ${job.coverageSettings} as JSON`)
    }
    overrideDirIfNotSet('coverageReportDir', settings['report-dir'])
    overrideDirIfNotSet('coverageTempDir', settings['temp-dir'])
    overrideIfNotSet('coverageReporters', settings.reporter)
  }

  if (job.mode === 'url') {
    const port = job.port.toString()
    job[$remoteOnLegacy] = job.url.every(url => {
      // ignore host name since the machine might be exposed with any name
      const parsedUrl = new URL(url)
      return parsedUrl.port === port
    })
  }

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

  let defaultPath = join(job.cwd, 'ui5-test-runner.json')
  if (!isAbsolute(defaultPath)) {
    defaultPath = join(job.initialCwd, defaultPath)
  }
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
