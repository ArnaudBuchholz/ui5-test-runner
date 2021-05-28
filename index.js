#!/usr/bin/env node

'use strict'

const { log, serve } = require('reserve')
const jobFactory = require('./src/job')
const reserveConfigurationFactory = require('./src/reserve')
const executeTests = require('./src/tests')

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
      executeTests(job)
    })
    .on('error', args => {
      console.log('ERROR', args)
    })
}

main()
