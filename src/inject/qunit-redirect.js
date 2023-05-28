(function () {
  'use strict'

  const MODULE = 'ui5-test-runner/qunit-redirect'
  if (window[MODULE]) {
    return // already installed
  }
  window[MODULE] = true

  /* global suite */

  const post = window['ui5-test-runner/post']

  const pages = []

  function jsUnitTestSuite () {}

  jsUnitTestSuite.prototype.addTestPage = function (url) {
    pages.push(url)
  }

  window.jsUnitTestSuite = jsUnitTestSuite

  window.addEventListener('load', function () {
    if (typeof suite === 'function') {
      suite()
      post('addTestPages', pages)
    } else if (typeof QUnit === 'object') {
      post('addTestPages', [location.toString()])
    } else {
      post('addTestPages', []) // No page
    }
  })
}())
