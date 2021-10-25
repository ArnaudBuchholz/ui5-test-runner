'use strict'

const { extractUrl } = require('./tools')
const { join } = require('path')
const { writeFile } = require('fs')
const output = require('./output')

module.exports = job => {
  const unhandled = join(job.tstReportDir, 'unhandled.txt')
  let outputUnhandled = true
  return [{
    custom: ({ headers, method, url }) => {
      if (method === 'GET' && url.match(/favicon\.ico$|-preload\.js$|-dbg(\.[^.]+)*\.js$|i18n_\w+\.properties$/)) {
        return 404 // expected
      }
      let status
      if (method === 'GET') {
        status = 404
      } else {
        status = 500
      }
      if (outputUnhandled) {
        output.unhandled()
        outputUnhandled = false
      }
      writeFile(unhandled, `${extractUrl(headers)} ${status} ${method} ${url}`, {
        flag: 'a'
      })
      return status
    }
  }]
}
