'use strict'

const { start } = require('./browsers')
const { generateCoverageReport } = require('./coverage')
const job = require('./job')
const progress = require('./progress')

async function extractTestPages () {
  progress('Extracting test pages')
  await start('test/testsuite.qunit.html')
  job.testPagesStarted = 0
  job.testPagesCompleted = 0
  job.testPagesById = {}
  job.testPagesByUrl = {}
  progress('Executing test pages')
  for (let i = 0; i < job.parallel; ++i) {
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
  const testPageUrl = job.testPageUrls[index]
  const promise = start(testPageUrl)
  const page = {
    id: promise.id,
    url: testPageUrl,
    tests: [],
    wait: Promise.resolve()
  }
  job.testPagesById[page.id] = page
  job.testPagesByUrl[page.url] = page
  progress()

  await promise
  progress()
  ++job.testPagesCompleted
  runTestPage()
}

async function generateReport () {
  progress('Finalizing')

  // Simple report
  let failed = 0
  for (const page of job.testPageUrls) {
    console.log(page)
    const results = job.testPagesByUrl[page]
    if (results) {
      console.table(results.tests.map(result => {
        return {
          name: result.name,
          passed: result.passed,
          failed: result.failed,
          total: result.total
        }
      }))
      console.log(results.report)
      failed += results.report.failed
    } else {
      console.log('(skipped)')
    }
  }

  await generateCoverageReport()

  console.log(`Time spent: ${new Date() - job.start}ms`)

  if (job.keepAlive) {
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
