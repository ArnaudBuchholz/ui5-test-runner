'use strict'

const assert = require('assert')

module.exports = [{
  label: 'UI5 focus handling',
  url: 'ui5-focus/index.html',
  endpoint: ({ body }) => {
    assert.strictEqual(body['is-focus-set'], true)
  }
}]
