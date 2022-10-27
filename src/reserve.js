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
    ...endpoints(job),
    ...ui5(job),
    ...coverage(job), {
      // Project mapping
      match: /^\/(.*)/,
      file: join(job.webapp, '$1'),
      strict: true,
      'ignore-if-not-found': true
    },
    ...job.mappings ?? [],
    ...unhandled(job)
  ]
})
