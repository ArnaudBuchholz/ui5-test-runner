'use strict'

const { accessSync } = require('fs')
const { join, isAbsolute } = require('path')
const output = require('./output')

function allocate (cwd) {
  return {
    initialCwd: cwd,
    cwd,
    port: 0,
    ui5: 'https://ui5.sap.com',
    libs: [],
    cache: '',
    webapp: 'webapp',
    testsuite: 'test/testsuite.qunit.html',
    pageFilter: '',
    pageParams: '',
    pageTimeout: 0,
    globalTimeout: 0,
    failFast: false,
    keepAlive: false,
    watch: false,
    logServer: false,

    browser: join(__dirname, '../defaults/chromium.js'),
    browserRetry: 1,
    noScreenshot: false,
    args: '__URL__ __REPORT__',

    parallel: 2,
    tstReportDir: 'report',

    coverage: true,
    covSettings: join(__dirname, '../defaults/nyc.json'),
    covTempDir: '.nyc_output',
    covReportDir: 'coverage',
    covReporters: 'lcov,cobertura'
  }
}

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
  checkAccess(job.webapp, 'webapp folder')
  checkAccess(job.browser, 'browser command')

  const testsuitePath = toAbsolute(job.testsuite, job.webapp)
  checkAccess(testsuitePath, 'testsuite')

  job.libs.forEach(libMapping => {
    libMapping.source = toAbsolute(libMapping.source)
    checkAccess(libMapping.source, `lib mapping of ${libMapping.relative}`)
  })

  if (job.parallel <= 0) {
    job.keepAlive = true
  }

  if (job.browserRetry < 0) {
    output.unexpectedOptionValue('browserRetry', 'defaulting to 1')
    job.browserRetry = 1
  }
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
    if (Object.prototype.hasOwnProperty.call(job, name)) {
      const valueParser = paramParser[name] || valueParsers[typeof job[name]] || valueParsers.default
      try {
        job[name] = valueParser(value, job[name])
      } catch (error) {
        output.unexpectedOptionValue(name, error.message)
      }
    }
  }
}

module.exports = {
  fromCmdLine (cwd, argv) {
    const job = allocate(cwd)
    try {
      const defaults = require(join(cwd, 'ui5-test-runner.json'))
      Object.assign(job, defaults)
    } catch (e) {
      // ignore
    }
    let defaultHasLibs = job.libs.length !== 0
    let inBrowserParams = false
    argv.forEach(arg => {
      if (inBrowserParams) {
        job.args += ` ${arg}`
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
    finalize(job)
    return job
  }
}
