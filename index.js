#!/usr/bin/env node

'use strict'

const { join } = require('path')
const endpoints = require('./src/endpoints')
const { mappings: coverage } = require('./src/coverage')
const ui5 = require('./src/ui5')
const executeTests = require('./src/tests')
const { check, log, serve } = require('reserve')
const unhandled = require('./src/unhandled')
const jobFactory = require('./src/job')

async function main () {
  const job = jobFactory.fromCmdLine(process.cwd(), process.argv)
  const configuration = await check({
    port: job.port,
    mappings: [
      ...endpoints(job),
      ...ui5(job),
      ...coverage(job), {
        // Project mapping
        match: /^\/(.*)/,
        file: join(job.webapp, '$1'),
        strict: true,
        'ignore-if-not-found': true
      },
      ...unhandled
    ]
  })
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
