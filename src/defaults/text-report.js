'use strict'

const { join, isAbsolute } = require('path')
const [, , reportDir, expectedWidth] = process.argv
const { pad } = require('../tools')

const p = pad(process.stdout.columns || parseInt(expectedWidth || '80', 10))
const log = console.log.bind(console)

function collectErrors (page) {
  const errors = []
  page.modules.forEach(module => {
    module.tests.every(test => {
      if (!test.report) {
        if (!test.skip) {
          test.logs ??= []
          test.logs.push({
            message: '(no report found)'
          })
          errors.push({ module: module.name, ...test })
          return false
        }
      } else if (test.report.failed) {
        errors.push({ module: module.name, ...test })
      }
      return true
    })
  })
  return errors
}

async function main () {
  let jobPath
  if (isAbsolute(reportDir)) {
    jobPath = join(reportDir, 'job.js')
  } else {
    jobPath = join(process.cwd(), reportDir, 'job.js')
  }
  const job = require(jobPath)
  const failedUrls = []
  let rendered = 0
  function render (url) {
    if (++rendered === 1) {
      log(p`┌─${pad.x('─')}───────────────────┐`)
    }
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
  if (rendered > 0) {
    log(p`└─${pad.x('─')}────────────────────┘`)
  }
  failedUrls.forEach(url => {
    log()
    log(p`[${pad.lt(url)}]`)
    const page = job.qunitPages && job.qunitPages[url]
    if (!page) {
      log(p`Unable to run the page (check the execution log)`)
    } else {
      const pageIndex = job.testPageUrls.indexOf(url)
      const pageHash = job.testPageHashes[pageIndex]
      if (pageHash) {
        log(p`Page execution folder name : ${pageHash}`)
      }
      let errors = collectErrors(page)
      const { length } = errors
      if (page.isOpa) {
        // Focus on the first error only
        errors = errors.slice(0, 1)
      }
      errors.forEach((test, index) => {
        if (index > 0) {
          log()
        }
        log(`${test.module} ▶ ${test.name}`)
        test.logs.filter(({ result }) => !result).forEach(({ message }) => log(message))
      })
      if (page.isOpa && length > 1) {
        log()
        log(p`(${length} errors occurred but it is recommended to focus on the first OPA error)`)
      }
    }
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
