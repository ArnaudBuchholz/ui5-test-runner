'use strict'

const { randomInt } = require('crypto')
const { spawn } = require('process')

module.exports = job => {
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
    const process = spawn(job.command, job.options.split(' ')
      .map(param => param
        .replace('$url', url)
        .replace('$id', id)
      ), { detached: true })
    let done
    const promise = new Promise(resolve => {
      done = resolve
    })
    job.browsers[id] = { process, done }
    promise.id = id
    return promise
  }

  function stop (id) {
    const { process, done } = job.browsers[id]
    delete job.browsers[id]
    process.kill('SIGKILL')
    done()
  }

  return { start, stop }
}
