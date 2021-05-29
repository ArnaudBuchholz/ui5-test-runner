#!/usr/bin/env node

'use strict'

const { log, serve } = require('reserve')
const jobFactory = require('./src/job')
const reserveConfigurationFactory = require('./src/reserve')
const executeTests = require('./src/tests')
const { watch } = require('fs')

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
      await executeTests(job)
      if (job.watch) {
        if (!job.watching) {
          console.log('Watching changes on', job.webapp)
          watch(job.webapp, { recursive: true }, (eventType, filename) => {
            console.log(eventType, filename)
            if (!job.start) {
              extractTestPages(job)
            }
          })
          job.watching = true
        }
      } else if (job.keepAlive) {
        console.log('Keeping alive.')
      } else {
        process.exit(job.failed)
      }
    })
    .on('error', args => {
      console.log('ERROR', args)
    })
}

main()
