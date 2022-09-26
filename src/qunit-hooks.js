'use strict'

const { screenshot, stop } = require('./browsers')
const { collect } = require('./coverage')
const { UTRError } = require('./error')

function getTest ({ tests }, testId, create = false) {
  let test = tests.find(({ id }) => id === testId)
  if (!test && create) {
    test = {
      id: testId
    }
    tests.push(test)
  }
  return test
}

module.exports = {
  async begin (job, url, { isOpa, totalTests, modules }) {
    if (!modules) {
      stop(job, url)
      throw UTRError.QUNIT_ERROR()
    }
    if (!job.qunitPages) {
      job.qunitPages = {}
    }
    const qunitPage = {
      start: new Date(),
      isOpa,
      failed: 0,
      passed: 0,
      tests: []
    }
    modules.forEach(module => {
      module.tests.forEach(test => getTest(qunitPage, test.testId, true))
    })
    job.qunitPages[url] = qunitPage
  },

  async log (job, url, { testId, runtime }) {
    const qunitPage = job.qunitPages[url]
    if (qunitPage.isOpa && job.browserCapabilities.screenshot) {
      const test = getTest(qunitPage, testId)
      if (!test.screenshots) {
        test.screenshots = []
      }
      test.screenshots.push(runtime)
      await screenshot(job, url, `${testId}-${runtime}`)
    }
  },

  async testDone (job, url, report) {
    const { testId, failed } = report
    const qunitPage = job.qunitPages[url]
    const test = qunitPage && getTest(qunitPage, testId)
    if (!test) {
      stop(job, url)
      throw UTRError.QUNIT_ERROR()
    }
    if (failed) {
      if (job.browserCapabilities.screenshot) {
        await screenshot(job, url, testId)
      }
      job.failed = true
      ++qunitPage.failed
    } else {
      ++qunitPage.passed
    }
    test.end = new Date()
    test.report = report
  },

  async done (job, url, report) {
    const qunitPage = job.qunitPages[url]
    if (!qunitPage) {
      stop(job, url)
      throw UTRError.QUNIT_ERROR()
    }
    if (job.browserCapabilities.screenshot) {
      await screenshot(job, url, 'done')
    }
    if (report.__coverage__) {
      collect(job, url, report.__coverage__)
      delete report.__coverage__
    }
    qunitPage.end = new Date()
    qunitPage.report = report
    stop(job, url)
  }
}
