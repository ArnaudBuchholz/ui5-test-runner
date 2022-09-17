'use strict'

const { probe, start } = require('./browsers')
const { instrument } = require('./coverage')
const { recreateDir } = require('./tools')
const { globallyTimedOut } = require('./timeout')
const { save, generate } = require('./report')
const output = require('./output')

async function extractTestPages (job) {
  job.start = new Date()
  await instrument(job)
  await recreateDir(job.reportDir)
  await save(job)
  job.status = 'Extracting test pages'
  job.testPageUrls = []
  await start(job, `http://localhost:${job.port}/${job.testsuite}`)
  if (job.testPageUrls.length === 0) {
    output.noTestPageFound()
    job.failed = true
    return Promise.resolve()
  }
  job.testPagesStarted = 0
  job.testPagesCompleted = 0
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
    return await generate(job)
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
  }
  ++job.testPagesCompleted
  return runTestPage(job)
}

module.exports = {
  async execute (job) {
    await probe(job)
    return extractTestPages(job)
  }
}
