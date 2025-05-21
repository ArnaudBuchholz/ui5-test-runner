'use strict'

const assert = require('assert')

module.exports = [{
  label: 'Loads a page',
  url: 'basic/index.html'
}, {
  label: 'Loads a UI5 example',
  for: capabilities => !capabilities.modules.includes('jsdom'), // does not work anymore on JSDOM
  url: 'basic/ui5.html',
  endpoint: ({ body }) => {
    assert.strictEqual(body['sap.m.Button'], true)
  }
}, {
  label: 'Loads a UI5 inside an iframe',
  for: capabilities => !capabilities.modules.includes('jsdom'), // does not work anymore on JSDOM
  url: 'basic/iframe.html',
  endpoint: ({ body }) => {
    assert.strictEqual(body['sap.m.Button'], true)
  }
}]
