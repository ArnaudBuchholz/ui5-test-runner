'use strict'

const { screenshot, stop } = require('./browsers')
const { collect } = require('./coverage')
const { UTRError } = require('./error')
const { getOutput } = require('./output')
const { basename } = require('path')
const { filename, stripUrlHash, allocPromise } = require('./tools')
const { $browsers } = require('./symbols')
const $doneResolve = Symbol('doneResolve')
const $doneTimeout = Symbol('doneTimeout')

function error (job, url, details = '') {
  stop(job, url)
  job.failed = true
  throw UTRError.QUNIT_ERROR(details)
}

function invalidTestId (job, url, testId) {
  error(job, url, `No QUnit unit test found with id ${testId}`)
}

function merge (targetModules, modules) {
  modules.forEach(module => {
    const { name } = module
    const targetModule = targetModules.filter(({ name: targetName }) => name === targetName)[0]
    if (targetModule === undefined) {
      targetModules.push(module)
    } else {
      module.tests.forEach(test => {
        const targetTest = targetModule.tests.filter(({ testId }) => test.testId === testId)[0]
        if (!targetTest) {
          targetModule.tests.push(test)
        }
      })
    }
  })
}

function filterModules (modules, url) {
  const moduleIdMatch = url.match(/\?.*\bmoduleId=([^&]+)/)
  if (moduleIdMatch) {
    const [, moduleId] = moduleIdMatch
    return modules.filter(module => module.moduleId === moduleId)
  }
  const moduleNameMatch = url.match(/\?.*\bmodule=([^&]+)/)
  if (moduleNameMatch) {
    const [, escapedModuleName] = moduleNameMatch
    const moduleName = decodeURIComponent(escapedModuleName)
    return modules.filter(module => module.name === moduleName)
  }
  return modules
}

function get (job, urlWithHash, { testId, modules, isOpa } = {}) {
  const url = stripUrlHash(urlWithHash)
  const page = job.qunitPages && job.qunitPages[url]
  if (!page) {
    error(job, url, `No QUnit page found for ${urlWithHash}`)
  }
  const progress = (job[$browsers] && job[$browsers][url] && job[$browsers][url].progress) || { total: 0, count: 0 }
  merge(page.modules, filterModules(modules || [], url))
  progress.total = page.count = page.modules.reduce((total, { tests }) => total + tests.length, 0)
  if (!page.isOpa && isOpa) {
    page.isOpa = true
  }
  let testModule
  let test
  if (testId !== undefined) {
    page.modules.every(module => {
      test = module.tests.find(test => test.testId === testId)
      if (test === undefined) {
        return true
      } else {
        testModule = module
        return false
      }
    })
    if (!test) {
      invalidTestId(job, url, testId)
    }
  }
  return { url, page, testModule, test, progress }
}

async function done (job, urlWithHash, report) {
  const { url, page } = get(job, urlWithHash)
  if (page.count === 0) {
    return // wait
  }
  const { promise, resolve } = allocPromise()
  page[$doneResolve] = resolve
  page[$doneTimeout] = setTimeout(async () => {
    if (job.browserCapabilities.screenshot) {
      try {
        await screenshot(job, url, 'done')
      } catch (error) {
        getOutput(job).genericError(error, url)
      }
    }
    page.end = new Date()
    if (report.__coverage__) {
      if (job.coverage) {
        await collect(job, url, report.__coverage__)
      }
      delete report.__coverage__
    }
    page.report = report
    stop(job, url)
    resolve()
  }, job.pageCloseTimeout)
  return promise
}

module.exports = {
  get,

  async begin (job, urlWithHash, details) {
    getOutput(job).debug('qunit/begin', 'begin', urlWithHash, details)
    const { isOpa, modules } = details
    const url = stripUrlHash(urlWithHash)
    if (!job.qunitPages) {
      job.qunitPages = {}
    }
    const qunitPage = {
      id: filename(url),
      start: new Date(),
      isOpa: !!isOpa,
      failed: 0,
      passed: 0,
      count: 0,
      modules: []
    }
    job.qunitPages[url] = qunitPage
    const { page, progress } = get(job, url, { modules })
    progress.count = 0
    progress.total = page.count
  },

  async testStart (job, urlWithHash, details) {
    getOutput(job).debug('qunit/testStart', 'testStart', urlWithHash, details)
    const { page, test } = get(job, urlWithHash, details)
    const { [$doneTimeout]: doneTimeout, [$doneResolve]: doneResolve } = page
    if (doneTimeout) {
      clearTimeout(doneTimeout)
      doneResolve()
    }
    test.start = new Date()
  },

  async log (job, urlWithHash, details) {
    getOutput(job).debug('qunit/log', 'log', urlWithHash, details)
    const { url, page, test } = get(job, urlWithHash, details)
    const { isOpa, modules, module, name, testId, ...log } = details
    if (!test) {
      invalidTestId(job, url, testId)
    }
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

  async testDone (job, urlWithHash, details) {
    getOutput(job).debug('qunit/testDone', 'testDone', urlWithHash, details)
    const { name, module, testId, assertions, ...report } = details
    const { failed } = report
    const { url, page, test, progress } = get(job, urlWithHash, { testId })
    if (!test) {
      invalidTestId(job, url, testId)
    }
    ++progress.count
    if (failed) {
      if (job.browserCapabilities.screenshot) {
        try {
          const absoluteName = await screenshot(job, url, testId)
          test.screenshot = basename(absoluteName)
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
    if (job.failOpaFast && failed) {
      // skip remaining tests
      page.modules.forEach(module => {
        module.tests.forEach(test => {
          if (!test.report) {
            test.skip = true
          }
        })
      })
      await done(job, urlWithHash, {
        failed: page.failed,
        passed: page.passed,
        total: page.count,
        runtime: 0
      })
    }
  },

  async done (job, urlWithHash, report) {
    getOutput(job).debug('qunit/done', 'done', urlWithHash, report)
    await done(job, urlWithHash, report)
  }
}
