#!/usr/bin/env node

'use strict'

const { log, serve } = require('reserve')
const jobFactory = require('./src/job')
const reserveConfigurationFactory = require('./src/reserve')
const executeTests = require('./src/tests')
const { watch } = require('fs')

function send (message) {
  if (process.send) {
    process.send(message)
  }
}

async function main () {
  const job = jobFactory.fromCmdLine(process.cwd(), process.argv)
  const configuration = await reserveConfigurationFactory(job)
  const server = serve(configuration)
  if (job.logServer) {
    log(server)
  }
  server
    .on('ready', async ({ url, port }) => {
      job.port = port
      if (!job.logServer) {
        console.log(`Server running at ${url}`)
      }
      send({ port })
      await executeTests(job)
      if (job.watch) {
        delete job.start
        if (!job.watching) {
          console.log('Watching changes on', job.webapp)
          watch(job.webapp, { recursive: true }, (eventType, filename) => {
            console.log(eventType, filename)
            if (!job.start) {
              executeTests(job)
            }
          })
          job.watching = true
        }
      } else if (job.keepAlive) {
        job.status = 'Serving'
        console.log('Keeping alive.')
      } else {
        process.exit(job.failed || 0)
      }
    })
    .on('error', error => {
      console.error('ERROR', error)
      send({ error })
    })
}

main()
