'use strict'

const { fork } = require('child_process')
const { join } = require('path')
const { recreateDir, filename } = require('./tools')
const { getPageTimeout } = require('./timeout')
const output = require('./output')

let lastScreenshotId = 0
const screenshots = {}

function start (job, relativeUrl) {
  if (!job.browsers) {
    job.browsers = {}
  }
  output.browserStart(relativeUrl)
  const reportDir = join(job.tstReportDir, filename(relativeUrl))
  const args = job.args.split(' ')
    .map(arg => arg
      .replace('__URL__', `http://localhost:${job.port}${relativeUrl}`)
      .replace('__REPORT__', reportDir)
    )
  const pageBrowser = {
    relativeUrl,
    reportDir,
    args,
    retry: 0
  }
  const promise = new Promise(resolve => {
    pageBrowser.done = resolve
  })
  job.browsers[relativeUrl] = pageBrowser
  run(job, pageBrowser)
  return promise.then(() => {
    output.browserStopped(relativeUrl)
  })
}

async function run (job, pageBrowser) {
  const { relativeUrl } = pageBrowser
  if (pageBrowser.retry) {
    output.browserRetry(relativeUrl, pageBrowser.retry)
  }
  await recreateDir(pageBrowser.reportDir)
  delete pageBrowser.stopped
  const childProcess = fork(job.browser, pageBrowser.args.map(arg => arg.replace('__RETRY__', pageBrowser.retry)), { stdio: 'inherit' })
  pageBrowser.childProcess = childProcess
  const timeout = getPageTimeout(job)
  if (timeout) {
    pageBrowser.timeoutId = setTimeout(() => {
      output.browserTimeout(relativeUrl)
      stop(job, relativeUrl)
    }, timeout)
  }
  childProcess.on('message', message => {
    if (message.command === 'screenshot') {
      const { id } = message
      screenshots[id]()
      delete screenshots[id]
    } else if (message.command === 'capabilities') {
      job.browserCapabilities = { ...message }
      delete job.browserCapabilities.command
      output.browserCapabilities(job.browserCapabilities)
    }
  })
  childProcess.on('close', () => {
    if (!pageBrowser.stopped) {
      output.browserClosed(relativeUrl)
      stop(job, relativeUrl, true)
    }
  })
  if (!job.browserCapabilities) {
    childProcess.send({ command: 'capabilities' })
  }
}

async function screenshot (job, relativeUrl, filename) {
  if (!job.browserCapabilities || !job.browserCapabilities.screenshot) {
    return
  }
  const pageBrowser = job.browsers[relativeUrl]
  if (pageBrowser) {
    const { childProcess } = pageBrowser
    if (childProcess.connected) {
      const id = ++lastScreenshotId
      const promise = new Promise(resolve => {
        screenshots[id] = resolve
      })
      childProcess.send({
        id,
        command: 'screenshot',
        filename
      })
      await promise
    }
  }
}

async function stop (job, relativeUrl, retry = false) {
  const pageBrowser = job.browsers[relativeUrl]
  if (pageBrowser) {
    pageBrowser.stopped = true
    const { childProcess, done, timeoutId } = pageBrowser
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    if (childProcess.connected) {
      childProcess.send({ command: 'stop' })
    }
    if (retry && ++pageBrowser.retry <= job.browserRetry) {
      run(job, pageBrowser)
    } else {
      delete job.browsers[relativeUrl]
      done()
    }
  }
}

module.exports = { start, screenshot, stop }
