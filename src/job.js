'use strict'

const { join, isAbsolute } = require('path')

const job = {
  cwd: process.cwd(),
  port: 0,
  ui5: 'https://ui5.sap.com/1.87.0',
  libs: '',
  cache: '',
  webapp: 'webapp',
  pageFilter: '',
  pageParams: '',
  pageTimeout: 0,
  globalTimeout: 0,
  keepAlive: false,
  watch: false,
  logServer: false,

  browser: join(__dirname, '../defaults/chromium.js'),
  args: '__URL__ __REPORT__',

  parallel: 2,
  tstReportDir: 'report',

  coverage: true,
  covSettings: join(__dirname, '../defaults/nyc.json'),
  covTempDir: '.nyc_output',
  covReportDir: 'coverage',
  covReporters: 'lcov,cobertura'
}

process.argv.forEach(arg => {
  const valueParsers = {
    boolean: value => value === 'true',
    number: value => parseInt(value, 10),
    default: value => value
  }

  const parsed = /-(\w+):(.*)/.exec(arg)
  if (parsed) {
    const [, name, value] = parsed
    if (Object.prototype.hasOwnProperty.call(job, name)) {
      const valueParser = valueParsers[typeof job[name]] || valueParsers.default
      job[name] = valueParser(value)
    }
  }
})

function toAbsolute (member, from = job.cwd) {
  if (!isAbsolute(job[member])) {
    job[member] = join(from, job[member])
  }
}

toAbsolute('cwd', process.cwd())
'libs,webapp,browser,tstReportDir,covSettings,covTempDir,covReportDir'
  .split(',')
  .forEach(setting => toAbsolute(setting))

module.exports = job
