'use strict'

const { start } = require('./browsers')
const { instrument, generateCoverageReport } = require('./coverage')
const { filename, recreateDir } = require('./tools')
const { join } = require('path')
const { copyFile, writeFile } = require('fs').promises
const { watch } = require('fs')
const { globallyTimedOut } = require('./timeout')

const job = require('./job')

async function extractTestPages () {
  job.start = new Date()
  await instrument()
  job.status = 'Extracting test pages'
  await recreateDir(job.tstReportDir)
  job.testPageUrls = []
  await start('/test/testsuite.qunit.html')
  job.testPagesStarted = 0
  job.testPagesCompleted = 0
  job.testPages = {}
  job.status = 'Executing test pages'
  for (let i = 0; i < Math.min(job.parallel, job.testPageUrls.length); ++i) {
    runTestPage()
  }
}

async function runTestPage () {
  const { length } = job.testPageUrls
  if (job.testPagesCompleted === length) {
    return generateReport()
  }
  if (job.testPagesStarted === length) {
    return
  }
  const index = job.testPagesStarted++
  const url = job.testPageUrls[index]
  if (globallyTimedOut()) {
    console.log('!! TIMEOUT', url)
  } else {
    await start(url)
    const page = job.testPages[url]
    if (page) {
      const reportFileName = join(job.tstReportDir, `${filename(url)}.json`)
      await writeFile(reportFileName, JSON.stringify(page))
    }
  }
  ++job.testPagesCompleted
  runTestPage()
}

async function generateReport () {
  job.status = 'Finalizing'
  // Simple report
  let failed = 0
  const pages = []
  for (const url of job.testPageUrls) {
    const page = job.testPages[url]
    if (page && page.report) {
      pages.push({
        url,
        failed: page.report.failed
      })
      failed += page.report.failed
    } else {
      pages.push({
        url,
        failed: -1
      })
      failed += 1
    }
  }
  console.table(pages)
  await copyFile(join(__dirname, 'report.html'), join(job.tstReportDir, 'report.html'))
  await generateCoverageReport()
  console.log(`Time spent: ${new Date() - job.start}ms`)
  job.status = 'Done'
  delete job.start
  if (job.watch) {
    if (!job.watching) {
      console.log('Watching changes on', job.webapp)
      watch(job.webapp, { recursive: true }, (eventType, filename) => {
        console.log(eventType, filename)
        if (!job.start) {
          extractTestPages()
        }
      })
      job.watching = true
    }
  } else if (job.keepAlive) {
    console.log('Keeping alive.')
  } else {
    process.exit(failed)
  }
}

if (!job.parallel) {
  module.exports = () => {}
} else {
  module.exports = extractTestPages
}
