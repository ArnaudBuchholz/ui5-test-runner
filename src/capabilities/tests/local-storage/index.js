'use strict'

const assert = require('assert')

module.exports = [{
  label: 'Local storage (1)',
  url: 'local-storage/index.html?value=1',
  endpoint: ({ body }) => {
    const { initial, modified } = body
    assert.ok(initial === undefined, 'The local storage starts empty')
    assert.ok(modified === '1', 'The local storage can be used')
  }
}, {
  label: 'Local storage (2)',
  url: 'local-storage/index.html?value=2',
  endpoint: ({ body }) => {
    const { initial, modified } = body
    assert.ok(initial === undefined, 'The local storage starts empty')
    assert.ok(modified === '2', 'The local storage can be used')
  }
}]
