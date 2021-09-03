'use strict'

const { join, isAbsolute } = require('path')

function allocate (cwd) {
  return {
    initialCwd: cwd,
    cwd,
    port: 0,
    ui5: 'https://ui5.sap.com',
    libs: [],
    cache: '',
    webapp: 'webapp',
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

function finalize (job) {
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

  job.libs.forEach(libMapping => {
    libMapping.source = toAbsolute(libMapping.source)
  })

  if (job.parallel <= 0) {
    job.keepAlive = true
  }

  if (job.browserRetry < 0) {
    console.warn('Invalid browserRetry value, defaulting to 1')
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
        console.error(`Unexpected value for option ${name} : ${error.message}`)
      }
    }
  }
}

module.exports = {
  fromCmdLine (cwd, argv) {
    const job = allocate(cwd)
    let inBrowserParams = false
    argv.forEach(arg => {
      if (inBrowserParams) {
        job.args += ` ${arg}`
      } else if (arg === '--') {
        inBrowserParams = true
      } else {
        parseJobParam(job, arg)
      }
    })
    finalize(job)
    return job
  }
}
