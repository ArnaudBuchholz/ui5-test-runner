'use strict'

const { fork } = require('child_process')
const { join } = require('path')
const { recreateDir, filename } = require('./tools')

const job = require('./job')

job.browsers = {}

async function start (relativeUrl) {
  console.log(relativeUrl)
  const reportDir = join(job.tstReportDir, filename(relativeUrl))
  await recreateDir(reportDir)

  const args = job.args.split(' ')
    .map(arg => arg
      .replace('__URL__', `http://localhost:${job.port}${relativeUrl}`)
      .replace('__REPORT__', reportDir)
    )
  const childProcess = fork(job.browser, args, { stdio: 'inherit' })
  let done
  const promise = new Promise(resolve => {
    done = resolve
  })
  job.browsers[relativeUrl] = { childProcess, done }
  return promise
}

function stop (relativeUrl) {
  const { childProcess, done } = job.browsers[relativeUrl]
  delete job.browsers[relativeUrl]
  childProcess.send({ command: 'stop' })
  done()
}

module.exports = { start, stop }
