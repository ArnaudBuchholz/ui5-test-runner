'use strict'

const { screenshot, stop } = require('./browsers')
const { collect } = require('./coverage')
const { UTRError } = require('./error')
const { getOutput } = require('./output')

function error (job, url) {
  stop(job, url)
  job.failed = true
  throw UTRError.QUNIT_ERROR()
}

function getPage (job, url) {
  const qunitPage = job.qunitPages && job.qunitPages[url]
  if (!qunitPage) {
    error(job, url)
  }
  return qunitPage
}

function getTest ({ tests }, testId) {
  return tests.find(({ id }) => id === testId)
}

module.exports = {
  async begin (job, url, { isOpa, totalTests, modules }) {
    if (!modules) {
      error(job, url)
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
      module.tests.forEach(test => {
        qunitPage.tests.push({
          id: test.testId
        })
      })
    })
    job.qunitPages[url] = qunitPage
  },

  async log (job, url, { testId, runtime }) {
    const qunitPage = getPage(job, url)
    if (qunitPage.isOpa && job.browserCapabilities.screenshot) {
      const test = getTest(qunitPage, testId)
      if (!test) {
        error(job, url)
      }
      if (!test.screenshots) {
        test.screenshots = []
      }
      try {
        await screenshot(job, url, `${testId}-${runtime}`)
        test.screenshots.push(runtime)
      } catch (error) {
        getOutput(job).genericError(error, url)
      }
    }
  },

  async testDone (job, url, report) {
    const { testId, failed } = report
    const qunitPage = getPage(job, url)
    const test = getTest(qunitPage, testId)
    if (!test) {
      error(job, url)
    }
    if (failed) {
      if (job.browserCapabilities.screenshot) {
        try {
          await screenshot(job, url, testId)
        } catch (error) {
          getOutput(job).genericError(error, url)
        }
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
    const qunitPage = getPage(job, url)
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
    qunitPage.end = new Date()
    qunitPage.report = report
    stop(job, url)
  }
}
