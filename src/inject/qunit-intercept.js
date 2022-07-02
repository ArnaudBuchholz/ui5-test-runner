/* Injected QUnit hooks */
(function () {
  'use strict'

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
        QUnit[property](callbacks[property])
      })
    }
  })
}())
