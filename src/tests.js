'use strict'

const { probe, start } = require('./browsers')
const { instrument } = require('./coverage')
const { recreateDir } = require('./tools')
const { globallyTimedOut } = require('./timeout')
const { save, generate } = require('./report')
const { getOutput } = require('./output')
const {
  $probeUrlsStarted,
  $probeUrlsCompleted,
  $testPagesStarted,
  $testPagesCompleted
} = require('./symbols')
const { capabilities } = require('./capabilities')

async function run (task, job) {
  const {
    urlsMember,
    startedMember,
    completedMember,
    method
  } = task
  const output = getOutput(job)
  const urls = job[urlsMember]
  const { length } = urls
  if (job[completedMember] === length) {
    return
  }
  if (job[startedMember] === length) {
    return
  }
  const index = job[startedMember]++
  const url = urls[index]
  if (globallyTimedOut(job)) {
    output.globalTimeout(url)
    job.failed = true
  } else if (job.failFast && job.failed) {
    output.failFast(url)
  } else {
    try {
      await method(job, url)
    } catch (error) {
      job.failed = true
    }
  }
  ++job[completedMember]
  return run(task, job)
}

async function probeUrl (job, url) {
  const output = getOutput(job)
  try {
    let scripts
    if (job.mode === 'url' && job.browserCapabilities.scripts) {
      scripts = [
        'post.js',
        'qunit-redirect.js'
      ]
    }
    await start(job, url, scripts)
  } catch (error) {
    output.startFailed(url, error)
    throw error
  }
}

async function runTestPage (job, url) {
  const output = getOutput(job)
  try {
    let scripts
    if (job.mode === 'url' && job.browserCapabilities.scripts) {
      scripts = [
        'post.js',
        'qunit-intercept.js',
        'qunit-hooks.js'
      ]
    }
    await start(job, url, scripts)
  } catch (error) {
    output.startFailed(url, error)
    throw error
  }
}

function parallelize (task, job) {
  const {
    urlsMember,
    completedMember,
    startedMember
  } = task
  job[startedMember] = 0
  job[completedMember] = 0
  const max = Math.min(job.parallel, job[urlsMember].length)
  const promises = []
  for (let i = 0; i < max; ++i) {
    promises.push(run(task, job))
  }
  return Promise.all(promises)
}

async function process (job) {
  const output = getOutput(job)
  job.start = new Date()
  delete job.failed
  await instrument(job)
  await save(job)
  job.testPageUrls = []

  job.status = 'Probing urls'
  await parallelize({
    urlsMember: 'url',
    startedMember: $probeUrlsStarted,
    completedMember: $probeUrlsCompleted,
    method: probeUrl
  }, job)

  if (job.testPageUrls.length !== 0) {
    job.status = 'Executing test pages'
    await parallelize({
      urlsMember: 'testPageUrls',
      startedMember: $testPagesStarted,
      completedMember: $testPagesCompleted,
      method: runTestPage
    }, job)
  } else if (Object.keys(job.qunitPages || []).length === 0) {
    output.noTestPageFound()
    job.failed = true
  }

  await generate(job)
}

module.exports = {
  async execute (job) {
    await recreateDir(job.reportDir)
    if (job.mode === 'capabilities') {
      return capabilities(job)
    }
    await probe(job)
    if (job.mode !== 'url') {
      job.url = [`http://localhost:${job.port}/${job.testsuite}`]
    }
    return process(job)
  }
}
