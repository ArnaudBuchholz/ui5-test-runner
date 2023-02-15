'use strict'

const assert = require('assert')

module.exports = [{
  label: 'Loads a page',
  url: 'basic/index.html'
}, {
  label: 'Loads a UI5 example',
  url: 'basic/ui5.html',
  endpoint: ({ body }) => {
    assert.strictEqual(body['sap.m.Button'], true)
  }
}, {
  label: 'Loads a UI5 inside an iframe',
  url: 'basic/iframe.html',
  endpoint: ({ body }) => {
    assert.strictEqual(body['sap.m.Button'], true)
  }
}]
