'use strict'

const assert = require('assert')

function qUnitEndpoints (data) {
  const { endpoint } = data
  if (!this.calls) {
    this.calls = {}
  }
  if (!this.calls[endpoint]) {
    this.calls[endpoint] = 1
  } else {
    ++this.calls[endpoint]
  }
  if (endpoint === 'QUnit/done') {
    assert.ok(this.calls['QUnit/begin'], 'QUnit/begin was triggered')
    assert.ok(this.calls['QUnit/log'], 'QUnit/log was triggered')
    assert.ok(this.calls['QUnit/testDone'], 'QUnit/testDone was triggered')
    return true
  }
  return false
}

module.exports = [{
  label: 'Scripts (QUnit)',
  for: capabilities => !!capabilities.scripts,
  url: 'scripts/qunit.html',
  scripts: ['post.js', 'qunit-hooks.js'],
  endpoint: qUnitEndpoints
}, {
  label: 'Scripts (TestSuite)',
  for: capabilities => !!capabilities.scripts,
  url: 'scripts/testsuite.html',
  scripts: ['post.js', 'qunit-redirect.js'],
  endpoint: function (data) {
    assert(data.endpoint === 'addTestPages', 'addTestPages was triggered')
    assert(data.body.type === 'suite', 'type = suite')
    assert(data.body.pages.length === 2, 'Two pages received')
    const pages = [
      '/unit/unitTests.qunit.html',
      '/integration/opaTests.iframe.qunit.html'
    ]
    pages.forEach((page, index) => assert(data.body.pages[index].endsWith(page), page))
  }
}, {
  label: 'Scripts (External QUnit)',
  for: capabilities => !!capabilities.scripts && !capabilities.modules.includes('jsdom'),
  url: 'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/Test.qunit.html?testsuite=test-resources/sap/ui/demo/orderbrowser/testsuite.qunit&test=unit/unitTests',
  scripts: ['post.js', 'qunit-hooks.js'],
  endpoint: qUnitEndpoints
}, {
  label: 'Scripts (IFrame Coverage)',
  for: capabilities => !!capabilities.scripts,
  url: 'scripts/iframe.html',
  scripts: ['opa-iframe-coverage.js'],
  endpoint: ({ body }) => {
    assert.strictEqual(body['coverage.html'].status, 'ok')
  }
}]
