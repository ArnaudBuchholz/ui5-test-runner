const {
  $networkWriter
} = require('./symbols')

const noop = () => {}

function fakeMatchMedia () {
  return {
    matches: false,
    addListener: noop,
    removeListener: noop
  }
}

function wrapXHR (window) {
  const { XMLHttpRequest } = window
  const { open } = XMLHttpRequest.prototype
  XMLHttpRequest.prototype.open = function (method, url, asynchronous) {
    window[$networkWriter].append({
      method,
      url,
      status: 'UNK'
    })
    return open.call(this, method, url, asynchronous)
  }
}

module.exports = window => {
  window.performance.timing = {
    navigationStart: new Date().getTime(),
    fetchStart: new Date().getTime()
  }
  window.matchMedia = window.matchMedia || fakeMatchMedia
  wrapXHR(window)
}
