'use strict'

const { screenshot, stop } = require('./browsers')
const { collect } = require('./coverage')
const { UTRError } = require('./error')
const { getOutput } = require('./output')
const { basename } = require('path')
const { filename, stripUrlHash } = require('./tools')

function error (job, url, details = '') {
  stop(job, url)
  job.failed = true
  throw UTRError.QUNIT_ERROR(details)
}

function get (job, urlWithHash, testId) {
  const url = stripUrlHash(urlWithHash)
  const page = job.qunitPages && job.qunitPages[url]
  if (!page) {
    error(job, url, `No QUnit page found for ${urlWithHash}`)
  }
  let test
  if (testId !== undefined) {
    page.modules.every(module => {
      test = module.tests.find(test => test.testId === testId)
      return test === undefined
    })
    if (!test) {
      error(job, url, `No QUnit unit test found with id ${testId}`)
    }
  }
  return { url, page, test }
}

module.exports = {
  get,

  async begin (job, urlWithHash, { isOpa, totalTests, modules }) {
    const url = stripUrlHash(urlWithHash)
    if (!totalTests || !modules) {
      error(job, url, 'Invalid begin hook details')
    }
    if (!job.qunitPages) {
      job.qunitPages = {}
    }
    const qunitPage = {
      id: filename(url),
      start: new Date(),
      isOpa: !!isOpa,
      failed: 0,
      passed: 0,
      count: totalTests,
      modules
    }
    job.qunitPages[url] = qunitPage
  },

  async testStart (job, urlWithHash, { module, name, testId }) {
    const { test } = get(job, urlWithHash, testId)
    test.start = new Date()
  },

  async log (job, urlWithHash, { module, name, testId, ...log }) {
    const { url, page, test } = get(job, urlWithHash, testId)
    if (!test.logs) {
      test.logs = []
    }
    test.logs.push(log)
    if (page.isOpa && job.browserCapabilities.screenshot && job.screenshot) {
      try {
        const absoluteName = await screenshot(job, url, `${testId}-${log.runtime}`)
        log.screenshot = basename(absoluteName)
      } catch (error) {
        getOutput(job).genericError(error, url)
      }
    }
  },

  async testDone (job, urlWithHash, { name, module, testId, assertions, ...report }) {
    const { failed } = report
    const { url, page, test } = get(job, urlWithHash, testId)
    if (failed) {
      if (job.browserCapabilities.screenshot) {
        try {
          await screenshot(job, url, testId)
        } catch (error) {
          getOutput(job).genericError(error, url)
        }
      }
      ++page.failed
      job.failed = true
    } else {
      ++page.passed
    }
    test.end = new Date()
    test.report = report
  },

  async done (job, urlWithHash, report) {
    const { url, page } = get(job, urlWithHash)
    if (job.browserCapabilities.screenshot) {
      try {
        await screenshot(job, url, 'done')
      } catch (error) {
        getOutput(job).genericError(error, url)
      }
    }
    if (report.__coverage__) {
      collect(job, url, report.__coverage__)
      delete report.__coverage__
    }
    page.end = new Date()
    page.report = report
    stop(job, url)
  }
}
