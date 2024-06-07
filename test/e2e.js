'use strict'

const { fork, spawn } = require('child_process')
const { join } = require('path')
const assert = require('assert/strict')
const { stat, readFile } = require('fs/promises')
require('dotenv').config()
const parallelize = require('../src/parallelize')
const { recreateDir, allocPromise } = require('../src/tools')
const { interactive, getOutput, newProgress } = require('../src/output')
const { $statusProgressCount, $statusProgressTotal } = require('../src/symbols')

const root = join(__dirname, '..')
const [node,, ...only] = process.argv

const qunitPages = expectedCount => job => assert.strictEqual(Object.keys(job.qunitPages).length, expectedCount, 'Number of test pages')
const coverage = ({ uncoveredShouldBeReported } = {}) => async job => {
  const { coverageTempDir, coverageReportDir } = job
  const mergedCoveragePath = join(coverageTempDir, 'merged/coverage.json')
  assert.strictEqual((await stat(mergedCoveragePath)).isFile(), true, 'Merged coverage file exists')
  const mergedCoverage = JSON.parse((await readFile(mergedCoveragePath)).toString())
  assert.ok(Object.keys(mergedCoverage).every(key => {
    const { path } = mergedCoverage[key]
    return path === key
  }), 'Merged coverage file contains only absolute paths (key === path)')
  assert.strictEqual((await stat(coverageReportDir)).isDirectory(), true, 'Coverage folder exists')
  assert.strictEqual((await stat(join(coverageReportDir, 'lcov-report/index.html'))).isFile(), true, 'Coverage HTML report exists')
  const lcov = (await readFile(join(coverageReportDir, 'lcov.info'))).toString()
  assert.ok(lcov.length > 0, 'lcov data exists')
  if (uncoveredShouldBeReported) {
    assert.ok(lcov.match(/\bcontroller(\/|\\)uncovered\.(js|ts)\b/), 'uncovered is reported')
  }
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
      const progress = newProgress(job, `🖧  ${label} (${port})`, 1, 0)
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
  join(root, 'node_modules/reserve/dist/cli.js'), '--silent', '--config', join(root, 'test/sample.js/reserve.json')
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
  id: 'WEBDRIVERIO',
  label: 'Webdriver.io browser',
  utr: '--debug-keep-report --capabilities --browser $/webdriverio.js'
}, {
  id: 'JS_LEGACY',
  label: 'Legacy JS Sample',
  utr: ['--cwd', join(root, './test/sample.js')],
  checks: [qunitPages(2)]
}, {
  id: 'JS_LEGACY_JUNIT_REPORT',
  label: 'Legacy JS Sample with junit XML report',
  utr: [
    '--cwd', join(root, './test/sample.js'),
    ...'--report-generator $/report.js $/junit-xml-report.js'.split(' ')
  ],
  checks: [
    qunitPages(2),
    async job => {
      assert.strictEqual((await stat(join(job.reportDir, 'junit.xml'))).isFile(), true, 'junit XML report exists')
    }
  ]
}, {
  id: 'JS_LEGACY_SPLIT',
  label: 'Legacy JS Sample with OPA split',
  utr: ['--cwd', join(root, './test/sample.js'), '--split-opa'],
  checks: [qunitPages(3)]
}, {
  id: 'JS_LEGACY_COVERAGE',
  label: 'Legacy JS Sample with coverage',
  utr: [
    '--cwd', join(root, './test/sample.js'),
    '--coverage-settings', join(root, './test/sample.js/nyc.json'),
    ...'--no-screenshot --coverage --coverage-check-statements 65'.split(' ')
  ],
  checks: [qunitPages(2), coverage({ uncoveredShouldBeReported: true })]
}, {
  id: 'JS_LEGACY_REMOTE',
  label: 'Legacy JS Sample accessed using --url',
  utr: [
    '--cwd', join(root, './test/sample.js'),
    '--port', ++port, '--url', `http://localhost:${port}/test/testsuite.qunit.html`],
  checks: [qunitPages(2)]
}, {
  id: 'JS_LEGACY_REMOTE_COVERAGE',
  label: 'Legacy JS Sample accessed using --url with coverage',
  utr: [
    '--cwd', join(root, './test/sample.js'),
    '--port', ++port,
    '--url', `http://localhost:${port}/test/testsuite.qunit.html`,
    '--coverage-settings', join(root, './test/sample.js/nyc.json'),
    ...'--no-screenshot --coverage --coverage-check-statements 65'.split(' ')
  ],
  checks: [qunitPages(2), coverage({ uncoveredShouldBeReported: true })]
}, {
  id: 'JS_REMOTE',
  label: 'Remote JS sample',
  before: ui5Serve,
  utr: '--url http://localhost:8080/test/testsuite.qunit.html',
  checks: [qunitPages(2)]
}, {
  id: 'JS_REMOTE_SPLIT',
  label: 'Remote JS sample with OPA split',
  before: ui5Serve,
  utr: '--url http://localhost:8080/test/testsuite.qunit.html --split-opa',
  checks: [qunitPages(3)]
}, {
  id: 'JS_REMOTE_COVERAGE_MAPPED',
  label: 'Remote JS sample with coverage (with local mapping)',
  before: ui5Serve,
  utr: [
    '--cwd', join(root, './test/sample.js'),
    '--coverage-settings', join(root, './test/sample.js/nyc.json'),
    ...'--url http://localhost:8080/test/testsuite.qunit.html --no-screenshot --coverage --coverage-check-statements 65'.split(' ')
  ],
  checks: [qunitPages(2), coverage({ uncoveredShouldBeReported: true })]
}, {
  id: 'JS_REMOTE_COVERAGE',
  label: 'Remote JS sample with coverage (no local mapping)',
  before: ui5Serve,
  utr: [
    '--coverage-settings', join(root, './test/sample.js/nyc.json'),
    ...'--url http://localhost:8080/test/testsuite.qunit.html --no-screenshot --coverage --coverage-check-statements 65'.split(' ')
  ],
  checks: [qunitPages(2), coverage({ uncoveredShouldBeReported: true })]
}, {
  id: 'JS_REMOTE_BASIC_AUTHENT',
  label: 'Remote JS sample with basic authent',
  before: serveWithBasicAuthent,
  utr: [
    '--url http://localhost:8081/test/testsuite.qunit.html',
    '--browser $/puppeteer.js',
    '--browser-args --basic-auth-username testUsername',
    '--browser-args --basic-auth-password testPassword'
  ].join(' '),
  checks: [qunitPages(2)]
}, {
  id: 'JS_REMOTE_UI5_SAMPLE',
  label: 'Remote JS UI5 sample',
  utr: [
    '--url',
    'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/unitTests.qunit.html',
    'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/opaTests.qunit.html',
    '--no-screenshot'
  ]
}, {
  id: 'JS_REMOTE_UI5_SAMPLE_COVERAGE',
  label: 'Remote JS UI5 sample with coverage (experimental)',
  utr: [
    '--url',
    'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/unitTests.qunit.html',
    'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/integration/opaTests.qunit.html',
    '--no-screenshot',
    ...'--coverage --coverage-proxy --coverage-proxy-include /webapp/ --coverage-proxy-exclude /resources/|/webapp/test/ --disable-ui5'.split(' ')
  ],
  checks: [coverage()]
}, {
  id: 'TS_REMOTE',
  label: 'Remote TS sample',
  before: ui5ServeTs,
  utr: '--url http://localhost:8082/test/testsuite.qunit.html',
  checks: [qunitPages(2)]
}, {
  id: 'TS_REMOTE_COVERAGE_MAPPED',
  label: 'Remote TS sample with coverage (with local mapping)',
  before: ui5ServeTsWitCoverage,
  utr: [
    '--cwd', join(root, './test/sample.ts'),
    '--coverage-settings', join(root, './test/sample.ts/nyc.json'),
    ...'--url http://localhost:8083/test/testsuite.qunit.html --no-screenshot --coverage --coverage-check-statements 53'.split(' ')
  ],
  checks: [qunitPages(2), coverage({ uncoveredShouldBeReported: true })]
}, {
  id: 'TS_REMOTE_COVERAGE',
  label: 'Remote TS sample with coverage (no local mapping)',
  before: ui5ServeTsWitCoverage,
  utr: [
    '--coverage-settings', join(root, './test/sample.ts/nyc.json'),
    ...'--url http://localhost:8083/test/testsuite.qunit.html --no-screenshot --coverage --coverage-check-statements 53'.split(' ')
  ],
  checks: [qunitPages(2), coverage({ uncoveredShouldBeReported: true })]
}].filter(({ id }) => {
  if (only.length) {
    if (only.includes(id)) {
      return true
    }
    return only.some(pattern => {
      if (pattern.includes('*')) {
        return new RegExp(pattern.replace(/\*/g, '.*')).test(id)
      }
      return false
    })
  }
  return process.env[`E2E_IGNORE_${id}`] !== 'true'
})

if (tests.length === 0) {
  console.error('❌ No test to execute.')
  process.exit(-1)
}

const job = {
  reportDir: join(root, 'e2e'),
  [$statusProgressCount]: 0,
  [$statusProgressTotal]: tests.length,
  status: 'E2E testing',
  errors: 0
}
const output = getOutput(job)

async function test ({ id, before, label, utr, checks }) {
  const progress = newProgress(job)
  const reportDir = join(root, 'e2e', id)
  progress.label = `${label} (${id})`
  progress.count = 1
  if (!interactive) {
    output.log(`${label}...`)
  }
  if (before) {
    try {
      await before()
    } catch (e) {
      ++job.errors
      output.log('❌', progress.label, e.toString())
      progress.done()
      return
    }
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
      if (checks) {
        const job = require(join(reportDir, 'job.js'))
        for (const check of checks) {
          await check(job)
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
