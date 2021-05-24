'use strict'

const { start } = require('./browsers')
const { instrument, generateCoverageReport } = require('./coverage')
const { filename, recreateDir } = require('./tools')
const { join } = require('path')
const { copyFile, writeFile } = require('fs').promises
const { watch } = require('fs')
const { globallyTimedOut } = require('./timeout')

async function extractTestPages (job) {
  job.start = new Date()
  await instrument(job)
  job.status = 'Extracting test pages'
  await recreateDir(job.tstReportDir)
  job.testPageUrls = []
  await start(job, '/test/testsuite.qunit.html')
  job.testPagesStarted = 0
  job.testPagesCompleted = 0
  job.testPages = {}
  job.status = 'Executing test pages'
  for (let i = 0; i < Math.min(job.parallel, job.testPageUrls.length); ++i) {
    runTestPage(job)
  }
}

async function runTestPage (job) {
  const { length } = job.testPageUrls
  if (job.testPagesCompleted === length) {
    return generateReport(job)
  }
  if (job.testPagesStarted === length) {
    return
  }
  const index = job.testPagesStarted++
  const url = job.testPageUrls[index]
  if (globallyTimedOut(job)) {
    console.log('!! TIMEOUT', url)
  } else {
    await start(job, url)
    const page = job.testPages[url]
    if (page) {
      const reportFileName = join(job.tstReportDir, `${filename(url)}.json`)
      await writeFile(reportFileName, JSON.stringify(page))
    }
  }
  ++job.testPagesCompleted
  runTestPage(job)
}

async function generateReport (job) {
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
  await generateCoverageReport(job)
  console.log(`Time spent: ${new Date() - job.start}ms`)
  job.status = 'Done'
  delete job.start
  if (job.watch) {
    if (!job.watching) {
      console.log('Watching changes on', job.webapp)
      watch(job.webapp, { recursive: true }, (eventType, filename) => {
        console.log(eventType, filename)
        if (!job.start) {
          extractTestPages(job)
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

module.exports = job => {
  if (job.parallel) {
    extractTestPages(job)
  } else {
    job.status = 'Serving'
    console.log('Keeping alive.')
  }
}
