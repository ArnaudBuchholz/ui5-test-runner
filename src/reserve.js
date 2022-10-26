const { join } = require('path')
const cors = require('./cors')
const proxies = require('./proxies')
const endpoints = require('./endpoints')
const { mappings: coverage } = require('./coverage')
const ui5 = require('./ui5')
const { check } = require('reserve')
const unhandled = require('./unhandled')

module.exports = job => check({
  port: job.port,
  mappings: [
    cors,
    ...proxies(job),
    ...endpoints(job),
    ...ui5(job),
    ...coverage(job), {
      // Project mapping
      match: /^\/(.*)/,
      file: join(job.webapp, '$1'),
      strict: true,
      'ignore-if-not-found': true
    },
    ...unhandled(job)
  ]
})
