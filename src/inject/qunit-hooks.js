/* Injected QUnit hooks */
(function () {
  'use strict'

  function post (url, data, sync) {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/_/' + url, !sync)
    xhr.send(JSON.stringify(data))
  }

  QUnit.begin(function (details) {
    post('QUnit/begin', details)
  })

  QUnit.testDone(function (report) {
    post('QUnit/testDone', report, true)
  })

  QUnit.done(function (report) {
    if (window.__coverage__) {
      report.__coverage__ = window.__coverage__
    }
    post('QUnit/done', report)
  })
}())
