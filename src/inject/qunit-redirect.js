(function () {
  'use strict'

  const pages = []

  function jsUnitTestSuite () {}

  jsUnitTestSuite.prototype.addTestPage = function (url) {
    pages.push(url)
  }

  window.jsUnitTestSuite = jsUnitTestSuite

  window.addEventListener('load', function () {
    suite()
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/_/addTestPages', false)
    xhr.send(JSON.stringify(pages))
    if (!location.toString().includes('__keepAlive__')) {
      window.close()
    }
  })
}())
