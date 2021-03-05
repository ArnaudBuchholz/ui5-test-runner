'use strict'

const { fork } = require('child_process')
const job = require('./job')

job.browsers = {}

function start (relativeUrl) {
  console.log(relativeUrl)
  const args = job.args.split(' ')
    .map(arg => arg.replace('__URL__', `http://localhost:${job.port}${relativeUrl}`))
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
