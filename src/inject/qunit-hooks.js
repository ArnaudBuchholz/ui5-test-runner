/* Injected QUnit hooks */
(function () {
  'use strict'

  function post (url, data) {
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/_/' + url)
      xhr.send(JSON.stringify(data))
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.responseText)
          } else {
            reject(xhr.statusText)
          }
        }
      }
    })
  }

  function isOpa () {
    try {
      return !!window.sap.ui.test.Opa5
    } catch (e) {
      return false
    }
  }

  QUnit.begin(function (details) {
    details.isOpa = isOpa()
    return post('QUnit/begin', details)
  })

  QUnit.log(function (report) {
    let ready = false
    post('QUnit/log', report).then(function () {
      ready = true
    })
    if (isOpa()) {
      window.sap.ui.test.Opa5.prototype.waitFor({
        timeout: 10,
        autoWait: false, // Ignore interactable constraint
        check: function () {
          return ready
        }
      })
    }
  })

  QUnit.testDone(function (report) {
    return post('QUnit/testDone', report)
  })

  QUnit.done(function (report) {
    if (window.__coverage__) {
      report.__coverage__ = window.__coverage__
    }
    return post('QUnit/done', report)
  })
}())
