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
  const failedUrls = []
  log(p`┌─${pad.x('─')}───────────────────┐`)
  function render (url) {
    const page = job.qunitPages && job.qunitPages[url]
    if (!page || !page.report) {
      log(p`│${pad.lt(url)} 🧨           │`)
      failedUrls.push(url)
    } else {
      const type = page.isOpa ? '🥼' : '🧪'
      const status = page.report.failed > 0 ? '🐞' : '  '
      if (page.report.failed > 0) {
        failedUrls.push(url)
      }
      log(p`│${pad.lt(url)} ${type} ${status} ${page.passed.toString().padStart(3, ' ')}/${page.count.toString().padEnd(3, ' ')}│`)
    }
  }
  job.testPageUrls.forEach(render)
  Object.keys(job.qunitPages || []).forEach(url => {
    if (!job.testPageUrls.includes(url)) {
      render(url)
    }
  })
  log(p`└─${pad.x('─')}────────────────────┘`)
  failedUrls.forEach(url => {
    log(p`[${pad.lt(url)}]`)
    const page = job.qunitPages && job.qunitPages[url]
    if (!page) {
      log(p`Unable to run the page (check the tool log for general errors)`)
    } else if (page.isOpa) {
      // Focus on the first error only

      if (page.failed > 1) {
        log(p`Other errors occurred but, for OPA tests, it is recommended to focus on the first one`)
      }
    }

    log()
  })
}

main()
  .catch(reason => {
    console.error(reason)
    return -1
  })
  .then((code = 0) => {
    process.exit(code)
  })
