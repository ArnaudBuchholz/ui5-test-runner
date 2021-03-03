'use strict'

const { join } = require('path')

const job = {
  cwd: process.cwd(),
  port: 0,
  ui5: 'https://ui5.sap.com/1.87.0',
  cache: '',
  webapp: 'webapp',
  keepAlive: false,
  logServer: false,

  command: 'node',
  args: join(__dirname, '../defaults/chromium.js') + ' $url',
  parallel: 2,

  coverage: true,
  covTempDir: '.nyc_output',
  covReportDir: 'coverage'
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

module.exports = job
