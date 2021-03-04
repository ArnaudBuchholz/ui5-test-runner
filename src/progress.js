'use strict'

require('colors')
const job = require('./job')
const readline = require('readline')

module.exports = (status) => {
  if (status !== undefined) {
    job.status = status
  }
  const stdout = process.stdout
  readline.cursorTo(process.stdout, 0)
  stdout.clearLine()
  stdout.write('Status '.gray + job.status.white)

  const columns = stdout.columns
  const nameLength = Math.floor(columns / 2 - 1)

  if (job.testPageUrls) {
    job.testPageUrls.forEach(url => {
      stdout.write('\n')
      let name
      if (url.length > nameLength) {
        name = '...' + url.substring(url.length - nameLength - 3)
      } else {
        name = url.padEnd(nameLength, ' ')
      }
      const page = job.testPagesByUrl[url]
      if (page) {
          if (page.report) {
            if (page.report.failed) {
                stdout.write(name.red) // an error occurred
            } else {
                stdout.write(name.green) // passed
            }
          } else {
            stdout.write(name.yellow + ' ' + page.id.toString().gray) // in progress
          }
      } else {
        stdout.write(name.gray) // pending
      }
    })
    stdout.write('\n')
  }
}
