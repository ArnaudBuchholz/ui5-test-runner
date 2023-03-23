const { join } = require('path')
const cors = require('./cors')
const endpoints = require('./endpoints')
const { mappings: coverage } = require('./coverage')
const ui5 = require('./ui5')
const { check } = require('reserve')
const unhandled = require('./unhandled')

module.exports = job => check({
  port: job.port,
  mappings: [
    cors,
    ...job.mappings ?? [],
    ...job.serveOnly ? [] : endpoints(job),
    ...ui5(job),
    ...job.serveOnly ? [] : coverage(job), {
      // Project mapping
      match: /^\/(.*)/,
      file: join(job.webapp, '$1'),
      strict: true,
      'ignore-if-not-found': true
    },
    ...unhandled(job)
  ]
})
