(function () {
  'use strict'

  const MODULE = 'ui5-test-runner/opa-iframe-coverage'

  if (window[MODULE]) {
    return // already installed
  }
  window[MODULE] = true

  if (window !== window.top) {
    // Inside an iframe
    Object.defineProperty(window, '__coverage__', {
      get () {
        return window.top.__coverage__
      },
      set (value) {
        window.top.__coverage__ = value
        return true
      }
    })
  }
}())
