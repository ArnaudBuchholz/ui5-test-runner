'use strict'

const parallelize = require('../src/parallelize')
const { recreateDir, filename, allocPromise } = require('../src/tools')
const { getOutput, newProgress } = require('../src/output')
const { $statusProgressCount, $statusProgressTotal } = require('../src/symbols')
const { fork } = require('child_process')
const { join } = require('path')

const root = join(__dirname, '..')

const tests = [{
  label: "Puppeteer browser",
  utr: "--debug-keep-report --capabilities --browser $/puppeteer.js"
}, {
  label: "JSDOM browser",
  utr: "--debug-keep-report --capabilities --browser $/jsdom.js"
}, {
  label: "Selenium-webdriver browser (chrome)",
  utr: "--debug-keep-report --capabilities --browser $/selenium-webdriver.js -- --browser chrome"
}]

const job = {
  [$statusProgressCount]: 0,
  [$statusProgressTotal]: tests.length,
  status: 'E2E testing',
  errors: 0
}
const output = getOutput(job)

async function test ({ label, utr }) {
  const progress = newProgress(job)
  const id = filename(label)
  const reportDir = join(root, 'e2e', id)
  progress.label = `${label} (${id})`
  progress.count = 1
  const { promise, resolve } = allocPromise()
  const childProcess = fork(
    join(root, 'index'),
    [
      '--report-dir', reportDir,
      '--output-interval', '1s',
      ...utr.split(' ')
    ],
    {
      stdio: [0, 'pipe', 'pipe', 'ipc']
    }
  )
  childProcess.on('close', async code => {
    if (code !== 0) {
      ++job.errors
      output.wrap(() => console.log('❌', label, code))
    } else {
      output.wrap(() => console.log('✔️ ', label))
    }
    resolve()
  })
  return promise.finally(() => {
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
