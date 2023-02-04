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
    this.addEventListener('readystatechange', () => {
      if (this.readyState === XMLHttpRequest.DONE) {
        const { status } = this
        window[$networkWriter].append({
          method,
          url,
          status
        })
      }
    })
    return open.call(this, method, url, asynchronous)
  }
}

module.exports = window => {
  window.addEventListener('error', event => {
    const { message, filename, lineno, colno } = event
    window.console.error(`${filename}@${lineno}:${colno}: ${message}`)
  })

  window.performance.timing = {
    navigationStart: new Date().getTime(),
    fetchStart: new Date().getTime()
  }
  window.matchMedia = window.matchMedia || fakeMatchMedia

  wrapXHR(window)
}
