const { join } = require('path')
const cors = require('./cors')
const endpoints = require('./endpoints')
const { mappings: coverage } = require('./coverage')
const { mappings: ui5 } = require('./ui5')
const { check } = require('reserve')
const unhandled = require('./unhandled')

module.exports = async job => check({
  port: job.port,
  mappings: [
    cors,
    ...job.mappings ?? [],
    ...job.serveOnly ? [] : endpoints(job),
    ...ui5(job),
    ...await coverage(job), {
      // Project mapping
      match: /^\/(.*)/,
      file: join(job.webapp, '$1'),
      strict: true,
      'ignore-if-not-found': true
    },
    ...job.serveOnly ? [{ status: 404 }] : unhandled(job)
  ]
})
