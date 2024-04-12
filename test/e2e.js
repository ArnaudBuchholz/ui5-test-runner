'use strict'

const { fork, spawn } = require('child_process')
const { join } = require('path')
const assert = require('assert/strict')
const { stat } = require('fs/promises')
require('dotenv').config()
const parallelize = require('../src/parallelize')
const { recreateDir, filename, allocPromise } = require('../src/tools')
const { interactive, getOutput, newProgress } = require('../src/output')
const { $statusProgressCount, $statusProgressTotal } = require('../src/symbols')

const root = join(__dirname, '..')
const [node,, only] = process.argv
if (only) {
  process.env.E2E_ONLY = only
}

const qunitPages = expectedCount => job => assert.strictEqual(Object.keys(job.qunitPages).length, expectedCount, 'Number of test pages')
const coverage = () => async job => {
  const { coverageReportDir } = job
  assert.strictEqual((await stat(coverageReportDir)).isDirectory(), true, 'Coverage folder exists')
  assert.strictEqual((await stat(join(coverageReportDir, 'lcov-report/index.html'))).isFile(), true, 'Coverage HTML report exists')
}

const waitFor = (url, timeout = 30000) => new Promise((resolve, reject) => {
  const start = Date.now()
  const loop = async () => {
    try {
      await fetch(url)
      resolve()
    } catch (e) {
      if (Date.now() - start > timeout) {
        reject(new Error(`Timeout while waiting for ${url}`))
      }
      setTimeout(loop, 250)
    }
  }
  loop()
})

const serve = (label, port, parameters, cwd) => {
  let promise
  return () => {
    if (!promise) {
      const progress = newProgress(job, `🛜  ${label} (${port})`, 1, 0)
      spawn(node, parameters, { cwd, stdio: [0, 'pipe', 'pipe'] })
      promise = waitFor(`http://localhost:${port}`)
        .then(() => {
          progress.count = 1
        })
    }
    return promise
  }
}

const ui5Serve = serve('ui5 serve', 8080, [
  join(root, 'node_modules/@ui5/cli/bin/ui5.cjs'), 'serve', '--config', join(root, 'test/sample.js/ui5.yaml')
])

const serveWithBasicAuthent = serve('reserve with basic-authent', 8081, [
  join(root, 'node_modules/reserve/index.js'), '--silent', '--config', join(root, 'test/sample.js/reserve.json')
])

const ui5ServeTs = serve('ui5 serve with transpiling', 8082, [
  join(root, 'test/sample.ts/ui5.cjs'), 'serve'
], join(root, 'test/sample.ts'))

const ui5ServeTsWitCoverage = serve('ui5 serve with transpiling and coverage', 8083, [
  join(root, 'test/sample.ts/ui5.cjs'), 'serve', '--config', 'ui5-coverage.yaml'
], join(root, 'test/sample.ts'))

let port = 8085

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
  tests: [qunitPages(2)]
}, {
  id: 'JS_LEGACY_SPLIT',
  label: 'Legacy JS Sample with OPA split',
  utr: ['--cwd', join(root, './test/sample.js'), '--split-opa'],
  tests: [qunitPages(3)]
}, {
  id: 'JS_LEGACY_COVERAGE',
  label: 'Legacy JS Sample with coverage',
  utr: ['--cwd', join(root, './test/sample.js'), ...'--coverage --coverage-settings nyc.json --coverage-check-statements 67'.split(' ')],
  tests: [qunitPages(2), coverage()]
}, {
  id: 'JS_LEGACY_REMOTE',
  label: 'Legacy JS Sample accessed using --url',
  utr: ['--cwd', join(root, './test/sample.js'), '--port', ++port, '--url', `http://localhost:${port}/test/testsuite.qunit.html`],
  tests: [qunitPages(2)]
}, {
  id: 'JS_LEGACY_REMOTE_COVERAGE',
  label: 'Legacy JS Sample accessed using --url with coverage',
  utr: [
    '--cwd', join(root, './test/sample.js'), '--port', ++port, '--url', `http://localhost:${port}/test/testsuite.qunit.html`,
    ...'--coverage --coverage-settings nyc.json --coverage-check-statements 67'.split(' ')
  ],
  tests: [qunitPages(2), coverage()]
}, {
  id: 'JS_REMOTE',
  label: 'Remote JS sample',
  before: ui5Serve,
  utr: '--url http://localhost:8080/test/testsuite.qunit.html',
  tests: [qunitPages(2)]
}, {
  id: 'JS_REMOTE_SPLIT',
  label: 'Remote JS sample with OPA split',
  before: ui5Serve,
  utr: '--url http://localhost:8080/test/testsuite.qunit.html --split-opa',
  tests: [qunitPages(3)]
}, {
  id: 'JS_REMOTE_COVERAGE',
  label: 'Remote JS sample with coverage',
  before: ui5Serve,
  utr: '--url http://localhost:8080/test/testsuite.qunit.html --coverage --coverage-check-statements 67',
  tests: [qunitPages(2), coverage()]
}, {
  id: 'JS_REMOTE_BASIC_AUTHENT',
  label: 'Remote JS sample with basic authent',
  before: serveWithBasicAuthent,
  utr: '--url http://localhost:8081/test/testsuite.qunit.html --browser $/puppeteer.js --browser-args --basic-auth-username testUsername --browser-args --basic-auth-password testPassword',
  tests: [qunitPages(2)]
}, {
  id: 'TS_REMOTE',
  label: 'Remote TS sample',
  before: ui5ServeTs,
  utr: '--url http://localhost:8082/test/testsuite.qunit.html',
  tests: [qunitPages(2)]
}, {
  id: 'TS_REMOTE_COVERAGE',
  label: 'Remote TS sample with coverage',
  before: ui5ServeTsWitCoverage,
  utr: '--url http://localhost:8083/test/testsuite.qunit.html --coverage --coverage-check-statements 67',
  tests: [qunitPages(2), coverage()]
}].filter(({ id }) => {
  if (process.env.E2E_ONLY) {
    return id === process.env.E2E_ONLY
  }
  return process.env[`E2E_IGNORE_${id}`] !== 'true'
})

const job = {
  reportDir: join(root, 'e2e'),
  [$statusProgressCount]: 0,
  [$statusProgressTotal]: tests.length,
  status: 'E2E testing',
  errors: 0
}
const output = getOutput(job)

async function test ({ before, label, utr, tests }) {
  const progress = newProgress(job)
  const id = filename(label)
  const reportDir = join(root, 'e2e', id)
  progress.label = `${label} (${id})`
  progress.count = 1
  if (!interactive) {
    output.log(`${label}...`)
  }
  if (before) {
    await before()
  }
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
      output.log('✔️ ', progress.label)
    }, (reason) => {
      ++job.errors
      output.log('❌', progress.label, reason)
    })
    .finally(() => {
      ++job[$statusProgressCount]
      progress.done()
    })
}

output.reportOnJobProgress()

recreateDir(join(root, 'e2e'))
  .then(() => parallelize(test, tests, parseInt(process.env.E2E_PARALLEL || '2', 10)))
  .then(
    () => {
      output.stop()
      if (job.errors !== 0) {
        console.error('👎', job.errors, 'test(s) failed, check the corresponding logs.')
      } else {
        console.error('👍 all tests succeeded.')
      }
      process.exit(job.errors)
    },
    error => {
      output.stop()
      console.error(error)
      process.exit(-1)
    }
  )
