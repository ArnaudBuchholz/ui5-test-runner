'use strict'

const { join, isAbsolute } = require('path')
const [, , reportDir] = process.argv
const { pad } = require('../tools')

const p = pad(process.stdout.columns || 80)
const log = console.log.bind(console)

async function main () {
  let jobPath
  if (isAbsolute(reportDir)) {
    jobPath = join(reportDir, 'job.js')
  } else {
    jobPath = join(process.cwd(), reportDir, 'job.js')
  }
  const job = require(jobPath)
  log(p`┌──────────${pad.x('─')}┐`)
  log(p`│ RESULTS ${pad.x(' ')} │`)
  log(p`├─────┬─${pad.x('─')}──┤`)
  const messages = []
  function result (url) {
    const page = job.qunitPages && job.qunitPages[url]
    let message
    if (!page || !page.report) {
      message = 'Unable to run the page'
    } else if (page.report.failed > 1) {
      message = `${page.report.failed} tests failed`
    } else if (page.report.failed === 1) {
      message = '1 test failed'
    }
    if (message) {
      log(p`│ ${(messages.length + 1).toString().padStart(3, ' ')} │ ${pad.lt(url)} │`)
      messages.push(message)
    } else {
      log(p`│ OK  │ ${pad.lt(url)} │`)
    }
  }
  job.testPageUrls.forEach(result)
  Object.keys(job.qunitPages || []).forEach(url => {
    if (!job.testPageUrls.includes(url)) {
      result(url)
    }
  })
  log(p`└─────┴───${pad.x('─')}┘`)
  messages.forEach((message, index) => {
    log(p`${(index + 1).toString().padStart(3, ' ')}: ${message}`)
  })
  if (!messages.length) {
    log(p`Success !`)
  }
}

main()
  .catch(reason => {
    console.error(reason)
    return -1
  })
  .then((code = 0) => {
    process.exit(code)
  })
