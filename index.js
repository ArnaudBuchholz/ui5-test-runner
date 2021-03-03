'use strict'

const { join } = require('path')
const job = require('./src/job')
const endpoints = require('./src/mappings/endpoints')(job)
const ui5 = require('./src/mappings/ui5')(job)
const { check, log, serve } = require('reserve')

async function main () {
  const configuration = await check({
    port: job.port,
    mappings: [
      ...endpoints,
      ...ui5, {
      // Project mapping
        match: /^\/(.*)/,
        file: join(job.cwd, job.webapp, '$1')
      }]
  })
  const server = serve(configuration)
  if (job.logServer) {
    log(server)
  }
  server
    .on('ready', ({ port }) => {
      job.port = port
    })
}

main()
