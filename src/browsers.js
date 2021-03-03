'use strict'

const { randomInt } = require('crypto')
const { fork } = require('child_process')
const job = require('./job')

job.browsers = {}

function start (relativeUrl) {
  if (!relativeUrl.startsWith('/')) {
    relativeUrl = '/' + relativeUrl
  }
  if (relativeUrl.includes('?')) {
    relativeUrl += '&'
  } else {
    relativeUrl += '?'
  }

  const id = randomInt(0xFFFFFFFF)

  let url = `http://localhost:${job.port}${relativeUrl}__id__=${id}`
  if (job.keepAlive) {
    url += '&__keepAlive__'
  }
  console.log(url)
  const parameters = { url, id }
  const args = job.args.split(' ')
    .map(arg => arg.replace(/\$(\w+)\b/, (match, name) => parameters[name] || match))
  const childProcess = fork(job.browser, args, { stdio: 'inherit' })
  let done
  const promise = new Promise(resolve => {
    done = resolve
  })
  job.browsers[id] = { childProcess, done }
  promise.id = id
  return promise
}

function stop (id) {
  const { childProcess, done } = job.browsers[id]
  delete job.browsers[id]
  childProcess.send({ command: 'stop' })
  done()
}

module.exports = { start, stop }
