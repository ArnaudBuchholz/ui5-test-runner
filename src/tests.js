'use strict'

const { probe, start } = require('./browsers')
const { instrument } = require('./coverage')
const { recreateDir } = require('./tools')
const { globallyTimedOut } = require('./timeout')
const { save, generate } = require('./report')
const { getOutput } = require('./output')
const { $testPagesStarted, $testPagesCompleted } = require('./symbols')
const { capabilities } = require('./capabilities')

async function extractTestPages (job) {
  const output = getOutput(job)
  job.start = new Date()
  await instrument(job)
  await save(job)
  job.status = 'Extracting test pages'
  job.testPageUrls = []
  const url = `http://localhost:${job.port}/${job.testsuite}`
  try {
    await start(job, url)
  } catch (error) {
    output.startFailed(url, error)
  }
  if (job.testPageUrls.length === 0) {
    output.noTestPageFound()
    job.failed = true
    return Promise.resolve()
  }
  job[$testPagesStarted] = 0
  job[$testPagesCompleted] = 0
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
  const output = getOutput(job)
  if (job[$testPagesCompleted] === length) {
    return await generate(job)
  }
  if (job[$testPagesStarted] === length) {
    return
  }
  const index = job[$testPagesStarted]++
  const url = job.testPageUrls[index]
  if (globallyTimedOut(job)) {
    output.globalTimeout(url)
    job.failed = true
  } else if (job.failFast && job.failed) {
    output.failFast(url)
  } else {
    try {
      await start(job, url)
    } catch (error) {
      output.startFailed(url, error)
      job.failed = true
    }
  }
  ++job[$testPagesCompleted]
  return runTestPage(job)
}

module.exports = {
  async execute (job) {
    await recreateDir(job.reportDir)
    if (job.mode === 'capabilities') {
      return capabilities(job)
    }
    await probe(job)
    if (job.mode !== 'legacy') {
      throw new Error('Not implemented')
    }
    return extractTestPages(job)
  }
}
