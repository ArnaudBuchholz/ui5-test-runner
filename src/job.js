'use strict'

const { Command, Option, InvalidArgumentError } = require('commander')
const { statSync, accessSync, constants } = require('fs')
const { dirname, join, isAbsolute } = require('path')
const { name, description, version = 'dev' } = require(join(__dirname, '../package.json'))
const { getOutput } = require('./output')
const { $valueSources, $remoteOnLegacy } = require('./symbols')
const { buildAndCheckMode } = require('./job-mode')
const { boolean, integer, timeout, url, arrayOf, regex, percent, string } = require('./options')

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
    const longName = `--${toLongName(name)}`
    args.push(longName)
    if (!longName.startsWith('--no-') && value !== null) {
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
  const DANGEROUS_OPTION = '[💣 use carefully]'

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
    .option('--config <json>', '[💻🔗🧪] Configuration file (relative to cwd)', string, 'ui5-test-runner.json')
    .option('--port <port>', '[💻🔗🧪] Port to use (0 to use any free one)', integer, 0)
    .option('-r, --report-dir <path>', '[💻🔗🧪] Directory to output test reports (relative to cwd)', 'report')
    .option('-pt, --page-timeout <timeout>', '[💻🔗🧪📡] Limit the page execution time, fails the page if it takes longer than the timeout (0 means no timeout)', timeout, 0)
    .option('-f, --fail-fast [flag]', '[💻🔗🧪📡] Stop the execution after the first failing page', boolean, false)
    .option('-fo, --fail-opa-fast [flag]', '[💻🔗📡] Stop the OPA page execution after the first failing test', boolean, false)
    .option('-k, --keep-alive [flag]', '[💻🔗🧪] Keep the server alive', boolean, false)
    .option('-l, --log-server [flag]', '[💻🔗🧪📡] Log inner server traces', boolean, false)
    .option('-p, --parallel <count>', '[💻🔗🧪] Number of parallel tests executions', integer, 2)
    .option('-b, --browser <command>', '[💻🔗🧪📡] Browser instantiation command (relative to cwd or use $/ for provided ones)', '$/puppeteer.js')
    .option('--browser-args <argument...>', '[💻🔗🧪📡] Browser instantiation command parameters (use -- instead)')
    .option('--alternate-npm-path <path>', '[💻🔗📡] Alternate NPM path to look for packages (priority: local, alternate, global)')
    .option('--no-npm-install', '[💻🔗🧪📡] Prevent any NPM install (execution may fail if a dependency is missing)')
    .option('-bt, --browser-close-timeout <timeout>', '[💻🔗🧪📡] Maximum waiting time for browser close', timeout, 2000)
    .option('-br, --browser-retry <count>', '[💻🔗🧪📡] Browser instantiation retries : if the command fails unexpectedly, it is re-executed (0 means no retry)', 1)
    .option('-oi, --output-interval <interval>', '[💻🔗🧪📡] Interval for reporting progress on non interactive output (CI/CD) (0 means no output)', timeout, 30000)
    .option('--offline [flag]', '[💻🔗🧪📡] Limit network usage (implies --no-npm-install)', boolean, false)
    .option('--env <name=value...>', '[💻🔗🧪📡] Set environment variable', arrayOf(string))
    .option('--localhost <host>', `[💻🔗🧪📡] ${DANGEROUS_OPTION} Hostname for legacy URLs and callbacks`, string, 'localhost')
    .option('--ci [flag]', '[💻🔗🧪📡] CI mode (no interactive output)', boolean, false)

    // Common to legacy and url
    .option('--webapp <path>', '[💻🔗] Base folder of the web application (relative to cwd)', 'webapp')
    .option('-pf, --page-filter <regexp>', '[💻🔗📡] Filter out pages not matching the regexp')
    .option('-pp, --page-params <params>', '[💻🔗📡] Add parameters to page URL')
    .option('--page-close-timeout <timeout>', '[💻🔗📡] Maximum waiting time for page close', timeout, 250)
    .option('-t, --global-timeout <timeout>', '[💻🔗📡] Limit the pages execution time, fail the page if it takes longer than the timeout (0 means no timeout)', timeout, 0)
    .option('--screenshot [flag]', '[💻🔗📡] Take screenshots during the tests execution (if supported by the browser)', boolean, true)
    .option('--no-screenshot', '[💻🔗📡] Disable screenshots during the tests execution (but not on failure, see --screenshot-on-failure)')
    .option('--screenshot-on-failure <flag>', '[💻🔗📡] Take a screenshot when a test fails (even if --screenshot is false)', boolean, true)
    .option('-st, --screenshot-timeout <timeout>', '[💻🔗📡] Maximum waiting time for browser screenshot', timeout, 5000)
    .option('-so, --split-opa [flag]', '[💻🔗📡] Split OPA tests using QUnit modules', boolean, false)
    .option('-rg, --report-generator <path...>', '[💻🔗📡] Report generator paths (relative to cwd or use $/ for provided ones)', ['$/report.js'])
    .option('--progress-page <path>', '[💻🔗📡] Progress page path (relative to cwd or use $/ for provided ones)', '$/report/default.html')

    .option('--coverage [flag]', '[💻🔗📡] Enable or disable code coverage', boolean)
    .option('--no-coverage', '[💻🔗📡] Disable code coverage')
    .option('-cs, --coverage-settings <path>', '[💻🔗📡] Path to a custom .nycrc.json file providing settings for instrumentation (relative to cwd or use $/ for provided ones)', '$/.nycrc.json')
    .option('-ctd, --coverage-temp-dir <path>', '[💻🔗] Directory to output raw coverage information to (relative to cwd)', '.nyc_output')
    .option('-crd, --coverage-report-dir <path>', '[💻🔗] Directory to store the coverage report files (relative to cwd)', 'coverage')
    .option('-cr, --coverage-reporters <reporter...>', '[💻🔗📡] List of nyc reporters to use (text is always used)', ['lcov', 'cobertura'])
    .option('-ccb, --coverage-check-branches <percent>', '[💻🔗📡] What % of branches must be covered', percent, 0)
    .option('-ccf, --coverage-check-functions <percent>', '[💻🔗📡] What % of functions must be covered', percent, 0)
    .option('-ccl, --coverage-check-lines <percent>', '[💻🔗📡] What % of lines must be covered', percent, 0)
    .option('-ccs, --coverage-check-statements <percent>', '[💻🔗📡] What % of statements must be covered', percent, 0)
    .option('-crs, --coverage-remote-scanner <path>', '[💻🔗📡] Scan for files when all coverage is requested', '$/scan-ui5.js')
    .option('-s, --serve-only [flag]', '[💻🔗] Serve only', boolean, false)

    .option('-w, --watch [flag]', '[💻🔗] Monitor the webapp folder (or the one specified with --watch-folder) and re-execute tests on change', boolean, false)
    .option('--watch-folder <path>', '[💻🔗] Folder to monitor with watch (enables --watch if not specified)', string)

    .option('--start <command>', '[💻🔗] Start command (might be an NPM script or a shell command)', string)
    .option('--start-wait-url <command>', '[💻🔗] URL to wait for (🔗 defaulted to first url)', url)
    .option('--start-wait-method <method>', '[💻🔗] HTTP method to check the waited URL', 'GET')
    .option('--start-timeout <timeout>', '[💻🔗] Maximum waiting time for the start command (based on when the first URL becomes available)', timeout, 5000)

    .option('--end <script>', '[💻🔗] End script (will receive path to `job.js`)', string)
    .option('--end-timeout <timeout>', '[💻🔗] Maximum waiting time for the end script', timeout, 15000)

    // Specific to legacy (and might be used with url if pointing to local project)
    .option('--ui5 <url>', '[💻📡] UI5 url', url, 'https://ui5.sap.com')
    .option('--disable-ui5 [flag]', '[💻📡] Disable UI5 mapping (also disable libs)', boolean, false)
    .addOption(new Option('--openui5 [flag]', '[💻📡] Special handling for OpenUI5 repository testing', boolean, false).hideHelp())
    .option('--libs <lib...>', '[💻📡] Library mapping (<relative>=<path> or <path>)', arrayOf(lib))
    .option('--mappings <mapping...>', '[💻📡] Custom mapping (<match>=<file|url>(<config>))', arrayOf(mapping))
    .option('--cache <path>', '[💻📡] Cache UI5 resources locally in the given folder (empty to disable)')
    .option('--preload <library...>', '[💻📡] Preload UI5 libraries in the cache folder (only if --cache is used)', arrayOf(string))
    .option('--testsuite <path>', '[💻] Path of the testsuite file (relative to webapp, URL parameters are supported)', 'test/testsuite.qunit.html')

    // Specific to coverage in url mode (experimental)
    .option('-cp, --coverage-proxy [flag]', `[🔗] ${EXPERIMENTAL_OPTION} use internal proxy to instrument remote files`, boolean, false)
    .option('-cpi, --coverage-proxy-include <regexp>', `[🔗] ${EXPERIMENTAL_OPTION} urls to instrument for coverage`, regex, '.*')
    .option('-cpe, --coverage-proxy-exclude <regexp>', `[🔗] ${EXPERIMENTAL_OPTION} urls to ignore for coverage`, regex, '/((test-)?resources|tests?)/')

    // Batch mode related
    .addOption(new Option('--batch-mode', 'Changes the way options are defaulted (in particular coverage temporary folders)', boolean).hideHelp())
    .option('--batch <specification...>', 'Batch specification', arrayOf(string))
    .option('--batch-id <id>', 'Batch id (used for naming report folder)', string)
    .option('--batch-label <label>', 'Batch label (used while reporting on execution)', string)
    .option('--if <condition>', 'Condition runner execution', string)

    .addOption(new Option('--debug-dev-mode', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-probe-only', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-keep-browser-open', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-memory', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-keep-report', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-capabilities-test <name>', DEBUG_OPTION).hideHelp())
    .addOption(new Option('--debug-capabilities-no-timeout', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-capabilities-no-script', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-coverage-no-custom-fs', DEBUG_OPTION, boolean).hideHelp())
    .addOption(new Option('--debug-verbose <module...>', DEBUG_OPTION, arrayOf(string), []).hideHelp())

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
    path = path.replace(/📂report\b/, job.reportDir)
    if (!isAbsolute(path)) {
      path = join(from, path)
    }
    if (path.endsWith('/') || path.endsWith('\\')) {
      return path.substring(0, path.length - 1)
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

  'browser,coverageSettings,coverageRemoteScanner,progressPage'
    .split(',')
    .forEach(setting => { job[setting] = checkDefault(job[setting]) })
  updateToAbsolute('cwd', job.initialCwd)
  'webapp,browser,reportDir,coverageSettings,coverageTempDir,coverageReportDir'
    .split(',')
    .forEach(setting => updateToAbsolute(setting))
  if (job.cache) {
    updateToAbsolute('cache')
    if (job.preload && job.offline) {
      throw new Error('--preload cannot be used with --offline')
    }
  } else if (job.preload) {
    throw new Error('--preload cannot be used without --cache')
  }
  if (job.alternateNpmPath) {
    checkAccess({ path: job.alternateNpmPath, label: 'Alternate NPM path' })
  }
  job.mode = buildAndCheckMode(job)
  if (job.mode === 'legacy') {
    checkAccess({ path: job.webapp, label: 'webapp folder' })

    const [, testsuiteFile] = job.testsuite.match(/([^?]*)(\?.*)?$/)
    const testsuitePath = toAbsolute(testsuiteFile, job.webapp)
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

  if (!job.env) {
    job.env = {}
  } else {
    job.env = job.env.reduce((dictionary, env) => {
      const equalPos = env.indexOf('=')
      if (equalPos === -1) {
        dictionary[env] = ''
      } else {
        dictionary[env.slice(0, equalPos)] = env.slice(equalPos + 1)
      }
      return dictionary
    }, {})
  }

  if (job.watchFolder) {
    job.watch = true
    job.watchFolder = updateToAbsolute(job.watchFolder)
  } else if (job.watch) {
    job.watchFolder = job.webapp
  }
  if (job.watchFolder) {
    checkAccess({ path: job.watchFolder, label: 'Folder to watch' })
  }

  const output = getOutput(job)

  if (job.coverage) {
    function overrideIfNotSet (option, valueFromSettings) {
      if (valueFromSettings && job[$valueSources][option] !== 'cli') {
        output.debug('coverage', `${option} extracted from nyc settings : ${valueFromSettings}`)
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

    checkAccess({ path: job.coverageRemoteScanner, label: 'coverage remote scanner', file: true })
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

  // Because start and end are already used
  job.startCommand = job.start
  delete job.start
  job.endScript = job.end
  delete job.end

  if (job.startCommand) {
    if (!job.startWaitUrl) {
      job.startWaitUrl = job.url[0]
    }
    if (!job.startWaitUrl) {
      throw new Error('Start command defined but no URL to wait for')
    }
  }

  if (job.batchMode) {
    job.outputInterval = 1000
  }

  /* istanbul ignore next */
  if (process.env.DEBUG_ON_FAILED) {
    let failed
    Object.defineProperty(job, 'failed', {
      get () {
        return failed
      },
      set (value) {
        if (value) {
          // eslint-disable-next-line no-debugger
          debugger
        }
        failed = value
      },
      enumerable: true,
      configurable: false
    })
  }
}

function fromCmdLine (cwd, cmdLineArgs) {
  let job = parse(cwd, cmdLineArgs)

  let defaultPath
  const isConfigSet = job[$valueSources].config === 'cli'
  if (isAbsolute(job.config)) {
    defaultPath = job.config
  } else {
    defaultPath = join(job.cwd, job.config)
    if (!isAbsolute(defaultPath)) {
      defaultPath = join(job.initialCwd, defaultPath)
    }
  }
  let hasDefaultSettings = false
  try {
    checkAccess({ path: defaultPath, file: true })
    hasDefaultSettings = true
  } catch (e) {
    if (isConfigSet) {
      throw e
    }
    // ignore
  }
  if (hasDefaultSettings) {
    const defaults = require(defaultPath)
    if (defaults.cwd && !isAbsolute(defaults.cwd)) {
      // make it relative to the configuration file
      defaults.cwd = join(dirname(defaultPath), defaults.cwd)
    } else if (isConfigSet) {
      defaults.cwd = dirname(defaultPath)
    }
    const { before, after, browser } = buildArgs(defaults)
    const sep = cmdLineArgs.indexOf('--')
    const args = sep === -1
      ? [...before, ...cmdLineArgs, ...after, '--', ...browser]
      : [...before, ...cmdLineArgs.slice(0, sep), ...after, '--', ...browser, ...cmdLineArgs.slice(sep + 1)]
    job = parse(cwd, args)
    job.configContent = defaults
    job.configArgs = args
  } else {
    job.configContent = 'none'
  }

  job.cmdLineArgs = cmdLineArgs
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
  fromObject,
  toLongName
}
