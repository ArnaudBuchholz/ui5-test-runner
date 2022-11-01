'use strict'

const assert = require('assert/strict')

module.exports = [{
  label: 'Timeout (100ms)',
  url: 'timeout/index.html?rate=100&wait=1000',
  endpoint: ({ body }) => {
    const { steps } = body
    assert(steps.length > 8, 'The right number of steps is generated')
  }
}, {
  label: 'Timeout (250ms)',
  url: 'timeout/index.html?rate=250&wait=1250',
  endpoint: ({ body }) => {
    const { steps } = body
    assert(steps.length > 3, 'The right number of steps is generated')
  }
}]
