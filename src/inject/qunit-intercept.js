/* Injected QUnit hooks */
(function () {
  'use strict'

  const MODULE = 'ui5-test-runner/qunit-intercept'
  if (window[MODULE]) {
    return // already installed
  }
  window[MODULE] = true

  const callbacks = {}
  const mock = new Proxy({}, {
    get: function (instance, property) {
      if (property !== 'version') {
        return function (callback) {
          callbacks[property] = callback
        }
      }
    }
  })

  let QUnit = mock

  Object.defineProperty(window, 'QUnit', {
    get: function () {
      return QUnit
    },

    set: function (value) {
      QUnit = value
      Object.keys(callbacks).forEach(property => {
        if (typeof QUnit[property] === 'function') {
          QUnit[property](callbacks[property])
        }
      })
    }
  })
}())
