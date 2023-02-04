'use strict'

const assert = require('assert')

const endpoint = ({ body }) => {
  assert.strictEqual(body.test, true)
}

module.exports = [{
  label: 'Dynamic include',
  url: 'dynamic-include/one.html',
  endpoint
}, {
  label: 'Dynamic includes',
  url: 'dynamic-include/two.html',
  endpoint
}, {
  label: 'Dynamic include mixed with a static one',
  url: 'dynamic-include/mix.html',
  endpoint
}]
