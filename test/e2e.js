'use strict'

const { fork } = require('child_process')
const { join } = require('path')
const assert = require('assert/strict')
require('dotenv').config()
const parallelize = require('../src/parallelize')
const { recreateDir, filename, allocPromise } = require('../src/tools')
const { getOutput, newProgress } = require('../src/output')
const { $statusProgressCount, $statusProgressTotal } = require('../src/symbols')
const jsonata = require('jsonata')

const root = join(__dirname, '..')

const tests = [{
  id: 'PUPPETEER',
  label: 'Puppeteer browser',
  utr: '--debug-keep-report --capabilities --browser $/puppeteer.js'
}, {
  id: 'JSDOM',
  label: 'JSDOM browser',
  utr: '--debug-keep-report --capabilities --browser $/jsdom.js'
}, {
  id: 'SELENIUM',
  label: 'Selenium-webdriver browser (chrome)',
  utr: '--debug-keep-report --capabilities --browser $/selenium-webdriver.js -- --browser chrome'
}, {
  id: 'PLAYWRIGHT',
  label: 'Playwright browser',
  utr: '--debug-keep-report --capabilities --browser $/playwright.js'
}, {
  id: 'JS_LEGACY',
  label: 'Legacy JS Sample',
  utr: ['--cwd', join(root, './test/sample.js')],
  tests: {
    '$count(qunitPages.*)': 2
  }
}].filter(({ id }) => {
  if (process.env.E2E_ONLY) {
    return id === process.env.E2E_ONLY
  }
  return process.env[`E2E_IGNORE_${id}`] !== 'true'
})

const job = {
  [$statusProgressCount]: 0,
  [$statusProgressTotal]: tests.length,
  status: 'E2E testing',
  errors: 0
}
const output = getOutput(job)

async function test ({ label, utr, tests }) {
  const progress = newProgress(job)
  const id = filename(label)
  const reportDir = join(root, 'e2e', id)
  progress.label = `${label} (${id})`
  progress.count = 1
  const { promise, resolve, reject } = allocPromise()
  const childProcess = fork(
    join(root, 'index'),
    [
      '--report-dir', reportDir,
      '--output-interval', '1s',
      ...Array.isArray(utr) ? utr : utr.split(' ')
    ],
    {
      stdio: [0, 'pipe', 'pipe', 'ipc']
    }
  )
  childProcess.on('message', data => {
    if (data.type === 'progress') {
      const { count, total } = data
      progress.count = count
      progress.total = total
    }
  })
  childProcess.on('close', async code => {
    if (code !== 0) {
      reject(code)
    } else {
      resolve()
    }
  })
  return promise
    .then(async () => {
      if (tests) {
        const job = require(join(reportDir, 'job.js'))
        for (const jpath of Object.keys(tests)) {
          const expected = tests[jpath]
          assert.deepStrictEqual(await jsonata(jpath).evaluate(job), expected, jpath)
        }
      }
    })
    .then(() => {
      output.wrap(() => console.log('✔️ ', label))
    }, (reason) => {
      ++job.errors
      output.wrap(() => console.log('❌', label, reason))
    })
    .finally(() => {
      ++job[$statusProgressCount]
      progress.done()
    })
}

output.reportOnJobProgress()

recreateDir(join(root, 'e2e'))
  .then(() => parallelize(test, tests, 2))
  .then(
    () => {
      output.stop()
      process.exit(job.errors)
    },
    error => {
      output.stop()
      console.error(error)
      process.exit(-1)
    }
  )
