(function () {
  'use strict'

  if (window['ui5-test-runner/qunit-redirect']) {
    return // already installed
  }
  window['ui5-test-runner/qunit-redirect'] = true

  /* global suite */

  const post = window['ui5-test-runner/post']

  const pages = []

  function jsUnitTestSuite () {}

  jsUnitTestSuite.prototype.addTestPage = function (url) {
    if (!url.startsWith('/')) {
      url = '/' + url
    }
    pages.push(url)
  }

  window.jsUnitTestSuite = jsUnitTestSuite

  window.addEventListener('load', function () {
    suite()
    post('addTestPages', pages)
  })
}())
