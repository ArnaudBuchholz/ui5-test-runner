(function () {
  'use strict'

  /* global suite */

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
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/_/addTestPages', false)
    xhr.send(JSON.stringify(pages))
  })
}())
