'use strict'

const { start } = require('./browsers')
const { instrument, generateCoverageReport } = require('./coverage')
const { filename, recreateDir } = require('./tools')
const { join } = require('path')
const { copyFile, writeFile } = require('fs').promises
const { globallyTimedOut } = require('./timeout')
const output = require('./output')

async function saveJob (job) {
  await writeFile(join(job.tstReportDir, 'job.json'), JSON.stringify({
    ...job,
    // Following members are useless because already serialized or not relevant
    status: undefined,
    testPageUrls: undefined,
    browsers: undefined,
    testPages: undefined
  }))
}

async function extractTestPages (job) {
  job.start = new Date()
  await instrument(job)
  await recreateDir(job.tstReportDir)
  await saveJob(job)
  job.status = 'Extracting test pages'
  job.testPageUrls = []
  await start(job, '/test/testsuite.qunit.html')
  if (job.testPageUrls.length === 0) {
    output.noTestPageFound()
    job.failed = true
    return Promise.resolve()
  }
  job.testPagesStarted = 0
  job.testPagesCompleted = 0
  job.testPages = {}
  job.status = 'Executing test pages'
  delete job.failed
  const promises = []
  for (let i = 0; i < Math.min(job.parallel, job.testPageUrls.length); ++i) {
    promises.push(runTestPage(job))
  }
  return Promise.all(promises)
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
    output.globalTimeout(url)
  } else if (job.failFast && job.failed) {
    output.failFast(url)
  } else {
    await start(job, url)
    const page = job.testPages[url]
    if (page) {
      const reportFileName = join(job.tstReportDir, `${filename(url)}.json`)
      await writeFile(reportFileName, JSON.stringify(page))
    }
  }
  ++job.testPagesCompleted
  return runTestPage(job)
}

async function generateReport (job) {
  job.status = 'Finalizing'
  // Simple report
  job.failed = 0
  const pages = []
  for (const url of job.testPageUrls) {
    const page = job.testPages[url]
    if (page && page.report) {
      pages.push({
        url,
        failed: page.report.failed
      })
      job.failed += page.report.failed
    } else {
      pages.push({
        url,
        failed: -1
      })
      job.failed += 1
    }
  }
  output.results(pages)
  await saveJob(job)
  await copyFile(join(__dirname, 'report.html'), join(job.tstReportDir, 'report.html'))
  await generateCoverageReport(job)
  output.timeSpent(job.start)
  job.status = 'Done'
}

module.exports = job => {
  if (job.parallel) {
    return extractTestPages(job)
  }
}
