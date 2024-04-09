'use strict'

const { fork } = require('child_process')
const { join } = require('path')
const assert = require('assert/strict')
const { stat } = require('fs/promises')
require('dotenv').config()
const parallelize = require('../src/parallelize')
const { recreateDir, filename, allocPromise } = require('../src/tools')
const { getOutput, newProgress } = require('../src/output')
const { $statusProgressCount, $statusProgressTotal } = require('../src/symbols')

const root = join(__dirname, '..')
const [,, only] = process.argv
if (only) {
  process.env.E2E_ONLY = only
}

const qunitPages = expectedCount => job => assert.strictEqual(Object.keys(job.qunitPages).length, expectedCount, 'Number of test pages')
const coverage = () => async job => {
  const { coverageReportDir } = job
  assert.strictEqual((await stat(coverageReportDir)).isDirectory(), true, 'Coverage folder exists')
  assert.strictEqual((await stat(join(coverageReportDir, 'lcov-report/index.html'))).isFile(), true, 'Coverage HTML report exists')
}

let port = 8080

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
  tests: [
    qunitPages(2)
  ]
}, {
  id: 'JS_LEGACY_SPLIT',
  label: 'Legacy JS Sample with OPA split',
  utr: ['--cwd', join(root, './test/sample.js'), '--split-opa'],
  tests: [
    qunitPages(3)
  ]
}, {
  id: 'JS_LEGACY_COVERAGE',
  label: 'Legacy JS Sample with coverage',
  utr: ['--cwd', join(root, './test/sample.js'), ...'--coverage --coverage-settings nyc.json --coverage-check-statements 67'.split(' ')],
  tests: [
    qunitPages(2),
    coverage()
  ]
}, {
  id: 'JS_LEGACY_REMOTE',
  label: 'Legacy JS Sample accessed using --url',
  utr: ['--cwd', join(root, './test/sample.js'), '--port', ++port, '--url', `http://localhost:${port}/test/testsuite.qunit.html`],
  tests: [
    qunitPages(2)
  ]
}, {
  id: 'JS_LEGACY_REMOTE_COVERAGE',
  label: 'Legacy JS Sample accessed using --url with coverage',
  utr: [
    '--cwd', join(root, './test/sample.js'), '--port', ++port, '--url', `http://localhost:${port}/test/testsuite.qunit.html`,
    ...'--coverage --coverage-settings nyc.json --coverage-check-statements 67'.split(' ')
  ],
  tests: [
    qunitPages(2),
    coverage()
  ]
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
  const parameters = [
    '--report-dir', reportDir,
    '--output-interval', '1s',
    ...Array.isArray(utr) ? utr : utr.split(' ')
  ]
  if (parameters.includes('--coverage')) {
    parameters.push(
      '--coverage-temp-dir', join(reportDir, '.nyc_output'),
      '--coverage-report-dir', join(reportDir, 'coverage')
    )
  }
  const childProcess = fork(
    join(root, 'index'),
    parameters,
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
        for (const test of tests) {
          await test(job)
        }
      }
    })
    .then(() => {
      output.wrap(() => console.log('✔️ ', progress.label))
    }, (reason) => {
      ++job.errors
      output.wrap(() => console.log('❌', progress.label, reason))
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
