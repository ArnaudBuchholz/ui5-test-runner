'use strict'

const { Command, Option } = require('commander')
const { accessSync } = require('fs')
const { join, isAbsolute } = require('path')
const output = require('./output')
const { name, description, version } = require(join(__dirname, '../package.json'))

function checkAccess (path, label) {
  try {
    accessSync(path)
  } catch (error) {
    throw new Error(`Unable to access ${label}, check your settings`)
  }
}

function finalize (job) {
  Object.keys(job)
    .filter(name => name.startsWith('!'))
    .forEach(name => { job[name.substring(1)] = job[name] })

  function toAbsolute (path, from = job.cwd) {
    if (!isAbsolute(path)) {
      return join(from, path)
    }
    return path
  }

  function updateToAbsolute (member, from = job.cwd) {
    job[member] = toAbsolute(job[member], from)
  }

  updateToAbsolute('cwd', job.initialCwd)
  'webapp,browser,tstReportDir,covSettings,covTempDir,covReportDir'
    .split(',')
    .forEach(setting => updateToAbsolute(setting))
  if (!job.url) {
    checkAccess(job.webapp, 'webapp folder')
    const testsuitePath = toAbsolute(job.testsuite, job.webapp)
    checkAccess(testsuitePath, 'testsuite')
  }
  checkAccess(job.browser, 'browser command')

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
      checkAccess(libMapping.source, `${description} (${libMapping.source})`)
    })
  }

  if (job.parallel <= 0) {
    job.keepAlive = true
  }

  if (job.browserRetry < 0) {
    output.unexpectedOptionValue('browserRetry', 'defaulting to 1')
    job.browserRetry = 1
  }

  'pageTimeout,globalTimeout,screenshotTimeout'
    .split(',')
    .forEach(setting => {
      if (job[setting] < 0) {
        output.unexpectedOptionValue(setting, 'defaulting to 0')
        job[setting] = 0
      }
    })
}

function parseJobParam (job, arg) {
  const valueParsers = {
    boolean: (value, defaultValue) => value === undefined ? !defaultValue : value === 'true',
    number: value => parseInt(value, 10),
    default: value => { if (!value) { throw new Error('must not be empty') } return value }
  }

  const paramParser = {
    libs: (value, defaultValue) => {
      if (value.includes('=')) {
        const [relative, source] = value.split('=')
        defaultValue.push({ relative, source })
      } else {
        defaultValue.push({ relative: '', source: value })
      }
      return defaultValue
    }
  }

  const parsed = /-(\w+)(?::(.*))?/.exec(arg)
  if (parsed) {
    const [, name, value] = parsed
    if (name !== 'browserArgs' && Object.prototype.hasOwnProperty.call(job, name)) {
      const valueParser = paramParser[name] || valueParsers[typeof job[name]] || valueParsers.default
      try {
        job[name] = valueParser(value, job[name])
      } catch (error) {
        output.unexpectedOptionValue(name, error.message)
      }
    }
  }
}

function lowerCaseKeys (dictionary) {
  return Object.keys(dictionary).reduce((result, name) => {
    const value = dictionary[name]
    if (name.startsWith('!')) {
      result[name] = value
    } else {
      result[name.charAt(0).toLocaleLowerCase() + name.substring(1)] = value
    }
    return result
  }, {})
}

module.exports = {
  fromCmdLine (cwd, argv) {
    const command = new Command()
    command
      .name(name)
      .description(description)
      .version(version)
      .addOption(
        new Option('-cwd <path>', 'Current working directory')
          .default(cwd, 'current working directory')
      )
      .option('-port <port>', 'Port to use (0 to use a free one)', 0)
      .option('-ui5 <url>', 'UI5 url', 'https://ui5.sap.com')
      .option('-lib <path...>', 'Library mapping')
      .option('-cache <path...>', 'Cache UI5 resources locally in the given folder (empty to disable)')
      .option('-webapp <path...>', 'Base folder of the web application (relative to cwd)', 'webapp')
      .option('-testsuite <path...>', 'Path of the testsuite file (relative to webapp)', 'test/testsuite.qunit.html')
      .option('-url <url...>', 'URL of the testsuite / page to test')

      .option('-pageFilter <regexp>', 'Filters which pages to execute')
      .option('-pageParams <params>', 'Parameters added to each page URL')
      .option('-pageTimeout <timeout>', 'Limit the page execution time (ms), fails the page if it takes longer than the timeout (0 to disable the timeout)', 0)
      .option('-globalTimeout <timeout>', 'Limit the pages execution time (ms), fails the page if it takes longer than the timeout (0 to disable the timeout)', 0)
      .option('-failFast', 'Stops the execution after the first failing page', false)
      .option('-keepAlive', 'Keeps the server alive (enables debugging)', false)
      .option('-watch', 'Monitors the webapp folder and re-execute tests on change', false)
      .option('-logServer', 'Logs server traces', false)

      .option('-browser <command>', 'Browser instantiation command', join(__dirname, '../defaults/puppeteer.js'))

      .option('-browserRetry <count>', 'Browser instantiation retries : if the command fails unexpectedly, it is re-executed (0 means no retry)', 1)
      .option('-noScreenshot', 'No screenshot is taken during the tests execution', false)
      .option('-screenshotTimeout <timeout>', 'Maximum waiting time (ms) for browser screenshot', 2000)

      .option('-parallel <count>', 'Number of parallel tests executions (0 to ignore tests and keep alive)', 2)
      .option('-tstReportDir <path>', 'Directory to output test reports (relative to cwd)', 'report')

      .option('-coverage <flag>', 'Enable or disable code coverage', true)
      .option('-covSettings <path>', 'Path to a custom nyc.json file providing settings for instrumentation (relative to cwd)', join(__dirname, '../defaults/nyc.json'))
      .option('-covTempDir <path>', 'Directory to output raw coverage information to (relative to cwd)', '.nyc_output')
      .option('-covReportDir <path>', 'Directory to store the coverage report files (relative to cwd)', 'coverage')
      .option('-covReporters <reporter...>', 'List of reporters to use', ['lcov', 'cobertura'])

    let defaults
    try {
      defaults = require(join(cwd, 'ui5-test-runner.json'))
    } catch (e) {
      defaults = {}
    }
    command.parse(argv, { from: 'user' })
    const job = Object.assign({
      initialCwd: cwd
    }, defaults, lowerCaseKeys(command.opts()))

/*
    let defaultHasLibs = defaults.libs.length !== 0
    let inBrowserParams = false
    argv.forEach(arg => {
      if (inBrowserParams) {
        job.browserArgs.push(arg)
      } else if (arg === '--') {
        inBrowserParams = true
      } else {
        if (arg.toString().startsWith('-libs:') && defaultHasLibs) {
          defaultHasLibs = false
          job.libs = []
        }
        parseJobParam(job, arg)
      }
    })
*/

    finalize(job)
    return job
  }
}
