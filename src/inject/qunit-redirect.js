(function () {
  'use strict'

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
