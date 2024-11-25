'use strict'

const assert = require('assert')

module.exports = [{
  label: 'Loads a page which requires the focus',
  url: 'ui5-focus/index.html',
  endpoint: ({ body }) => {
    assert.strictEqual(body['sap.m.Button'], true)
  }
}]
