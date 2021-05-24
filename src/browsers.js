'use strict'

const { fork } = require('child_process')
const { join } = require('path')
const { recreateDir, filename } = require('./tools')
const { getPageTimeout } = require('./timeout')

async function start (job, relativeUrl) {
  if (!job.browsers) {
    job.browsers = {}
  }
  console.log('>>', relativeUrl)
  const reportDir = join(job.tstReportDir, filename(relativeUrl))
  await recreateDir(reportDir)

  const args = job.args.split(' ')
    .map(arg => arg
      .replace('__URL__', `http://localhost:${job.port}${relativeUrl}`)
      .replace('__REPORT__', reportDir)
    )
  const childProcess = fork(job.browser, args, { stdio: 'inherit' })
  const pageBrowser = { childProcess }
  const promise = new Promise(resolve => {
    pageBrowser.done = resolve
  })
  const timeout = getPageTimeout(job)
  if (timeout) {
    pageBrowser.timeoutId = setTimeout(() => {
      console.log('!! TIMEOUT', relativeUrl)
      stop(relativeUrl)
    }, timeout)
  }
  job.browsers[relativeUrl] = pageBrowser
  return promise.then(() => {
    console.log('<<', relativeUrl)
  })
}

function stop (job, relativeUrl) {
  const pageBrowser = job.browsers[relativeUrl]
  if (pageBrowser) {
    const { childProcess, done, timeoutId } = pageBrowser
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    delete job.browsers[relativeUrl]
    childProcess.send({ command: 'stop' })
    done()
  }
}

module.exports = { start, stop }
