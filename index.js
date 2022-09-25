#!/usr/bin/env node

'use strict'

const { serve } = require('reserve')
const { fromCmdLine } = require('./src/job')
const { getOutput } = require('./src/output')
const reserveConfigurationFactory = require('./src/reserve')
const { execute } = require('./src/tests')
const { watch } = require('fs')

function send (message) {
  if (process.send) {
    process.send({
      pid: process.pid,
      ...message
    })
  }
}

async function notifyAndExecuteTests (job, output) {
  send({ msg: 'begin' })
  try {
    await execute(job)
    let status
    if (job.failed) {
      status = -1
    } else {
      status = 0
    }
    send({ msg: 'end', status })
  } catch (error) {
    output.genericError(error)
    send({ msg: 'error', error })
  }
}

let job
let output

async function main () {
  job = fromCmdLine(process.cwd(), process.argv.slice(2))
  output = getOutput(job)
  const configuration = await reserveConfigurationFactory(job)
  const server = serve(configuration)
  if (job.logServer) {
    server.on('redirected', output.redirected)
  }
  server
    .on('ready', async ({ url, port }) => {
      job.port = port
      send({ msg: 'ready', port: job.port })
      output.serving(url)
      output.reportOnJobProgress()
      await notifyAndExecuteTests(job)
      if (job.watch) {
        delete job.start
        if (!job.watching) {
          output.watching(job.webapp)
          watch(job.webapp, { recursive: true }, (eventType, filename) => {
            output.changeDetected(eventType, filename)
            if (!job.start) {
              notifyAndExecuteTests(job)
            }
          })
          job.watching = true
        }
      } else if (job.keepAlive) {
        job.status = 'Serving'
      } else if (job.failed) {
        output.stop()
        process.exit(-1)
      } else {
        output.stop()
        process.exit(0)
      }
    })
    .on('error', error => {
      output.genericError(error)
      send({ msg: 'error', error })
    })
}

main()
  .catch(reason => {
    output.genericError(reason)
    return -1
  })
  .then((code = 0) => {
    output.stop()
    process.exit(code)
  })
