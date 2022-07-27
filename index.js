#!/usr/bin/env node

'use strict'

const output = require('./src/output')
const { log, serve } = require('reserve')
const jobFactory = require('./src/job')
const reserveConfigurationFactory = require('./src/reserve')
const executeTests = require('./src/tests')
const { watch } = require('fs')

function send (message) {
  if (process.send) {
    process.send({
      pid: process.pid,
      ...message
    })
  }
}

async function notifyAndExecuteTests (job) {
  send({ msg: 'begin' })
  try {
    await executeTests(job)
    send({ msg: 'end', status: job.failed || 0 })
  } catch (error) {
    output.genericError(error)
    send({ msg: 'error', error })
  }
}

async function main () {
  const job = jobFactory.fromCmdLine(process.cwd(), process.argv.slice(2))
  const configuration = await reserveConfigurationFactory(job)
  const server = serve(configuration)
  if (job.logServer) {
    log(server)
  }
  server
    .on('ready', async ({ url, port }) => {
      job.port = port
      send({ msg: 'ready', port: job.port })
      if (!job.logServer) {
        output.serving(url)
      }
      output.report(job)
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
      } else {
        process.exit(job.failed || 0)
      }
    })
    .on('error', error => {
      output.genericError(error)
      send({ msg: 'error', error })
    })
}

main().catch(reason => output.genericError(reason))
