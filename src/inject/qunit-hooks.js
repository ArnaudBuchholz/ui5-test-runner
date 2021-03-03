/* Injected QUnit hooks */
(function () {
  'use strict'

  function post (url, data) {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/_/' + url, false)
    xhr.send(JSON.stringify(data))
  }

  QUnit.testDone(function (report) {
    post('QUnit/testDone', report)
  })

  QUnit.done(function (report) {
    if (window.__coverage__) {
      post('nyc/coverage', window.__coverage__)
    }
    post('QUnit/done', report)
    if (!location.toString().includes('__keepAlive__')) {
      window.close()
    }
  })
}())
