'use strict'

const { probe: probeBrowser, start } = require('./browsers')
const { instrument } = require('./coverage')
const { recreateDir } = require('./tools')
const { globallyTimedOut } = require('./timeout')
const { save, generate } = require('./report')
const { getOutput } = require('./output')
const {
  $statusProgressTotal,
  $statusProgressCount,
  $proxifiedUrls
} = require('./symbols')
const { UTRError } = require('./error')
const { preload } = require('./ui5')
const parallelize = require('./parallelize')

function task (job, method) {
  return async (url) => {
    const output = getOutput(job)
    if (globallyTimedOut(job)) {
      output.globalTimeout(url)
      job.failed = true
      job.timedOut = true
    } else if (job.failFast && job.failed) {
      output.failFast(url)
    } else {
      try {
        await method(job, url)
      } catch (error) {
        job.failed = true
      }
    }
    ++job[$statusProgressCount]
  }
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
    if (job.browserCapabilities.scripts) {
      scripts = [
        'post.js',
        'qunit-intercept.js',
        'qunit-hooks.js'
      ]
      if (job.coverage && !job.coverageProxy) {
        scripts.push(
          'opa-iframe-coverage.js',
          'ui5-coverage.js' // TODO detect if middleware exists before injecting this
        )
      }
    }
    if (job.coverageProxy) {
      const { origin } = new URL(url)
      const proxifiedUrl = url.replace(origin, `http://localhost:${job.port}`)
      if (!job[$proxifiedUrls]) {
        job[$proxifiedUrls] = {}
      }
      job[$proxifiedUrls][proxifiedUrl] = url
      await start(job, proxifiedUrl, scripts)
      job.qunitPages[url] = job.qunitPages[proxifiedUrl]
      delete job.qunitPages[proxifiedUrl]
    } else {
      await start(job, url, scripts)
    }
  } catch (error) {
    output.startFailed(url, error)
    throw error
  }
}

async function process (job) {
  const output = getOutput(job)
  job.start = new Date()
  job.failed = false
  await instrument(job)
  await save(job)
  job.testPageUrls = []

  job.status = 'Probing urls'
  job[$statusProgressTotal] = job.url.length
  job[$statusProgressCount] = 0
  try {
    await parallelize(task(job, probeUrl), job.url, job.parallel)
  } catch (e) {
    output.genericError(e)
    job.failed = true
  }

  /* istanbul ignore else */
  if (!job.debugProbeOnly && !job.failed) {
    if (job.testPageUrls.length !== 0) {
      job.status = 'Executing test pages'
      job[$statusProgressTotal] = job.testPageUrls.length
      job[$statusProgressCount] = 0
      try {
        await parallelize(task(job, runTestPage), job.testPageUrls, job.parallel)
      } catch (e) {
        output.genericError(e)
        job.failed = true
      }
    } else if (Object.keys(job.qunitPages || []).length === 0) {
      output.noTestPageFound()
      job.failed = true
    }
  }

  await generate(job)
}

module.exports = {
  async execute (job) {
    await recreateDir(job.reportDir)
    getOutput(job).version()
    if (job.preload) {
      await preload(job)
    }
    await probeBrowser(job)
    if (job.mode !== 'url') {
      job.url = [`http://localhost:${job.port}/${job.testsuite}`]
    } else if (!job.browserCapabilities.scripts) {
      throw UTRError.BROWSER_MISS_SCRIPTS_CAPABILITY()
    }
    return process(job)
  }
}
