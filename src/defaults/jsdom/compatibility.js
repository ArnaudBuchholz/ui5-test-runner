const noop = () => {}

function fakeMatchMedia () {
  return {
    matches: false,
    addListener: noop,
    removeListener: noop
  }
}

function wrapXHR (window, networkWriter) {
  const { XMLHttpRequest } = window
  const { open } = XMLHttpRequest.prototype
  XMLHttpRequest.prototype.open = function (...args) {
    const [method, url] = args
    const log = () => {
      const { status } = this
      networkWriter.append({
        method,
        url,
        status
      })
    }
    this.addEventListener('load', log)
    this.addEventListener('error', log)
    return open.call(this, ...args)
  }
}

function adjustXPathResult (window) {
  /* https://ui5.sap.com/resources/sap/ui/model/odata/AnnotationParser-dbg.js
     getXPath: function() {
       xmlNodes.length = xmlNodes.snapshotLength;
  */
  const { Document } = window
  const evaluate = Document.prototype.evaluate
  Document.prototype.evaluate = function () {
    const result = evaluate.apply(this, arguments)
    let length = result.length
    Object.defineProperty(result, 'length', {
      get: () => length,
      set: (value) => {
        length = value
        return true
      }
    })
    return result
  }
}

function fixMatchesDontThrow (window) {
  // https://github.com/jsdom/jsdom/issues/3057
  // Fix _nwsapiDontThrow which throws :-(
  const { document } = window
  const [impl] = Object.getOwnPropertySymbols(document)
  const documentImpl = document[impl]
  let _nwsapiDontThrow
  Object.defineProperty(documentImpl, '_nwsapiDontThrow', {
    get () {
      return _nwsapiDontThrow
    },
    set (nwsapiDontThrow) {
      _nwsapiDontThrow = nwsapiDontThrow
      const { match } = nwsapiDontThrow
      _nwsapiDontThrow.match = function () {
        try {
          return match.apply(this, arguments)
        } catch (e) {
          return false
        }
      }
      return true
    }
  })
}

module.exports = ({
  window,
  networkWriter
}) => {
  window.addEventListener('error', event => {
    const { message, filename, lineno, colno } = event
    window.console.error(`${filename}@${lineno}:${colno}: ${message}`)
  })

  window.performance.timing = {
    navigationStart: new Date().getTime(),
    fetchStart: new Date().getTime()
  }
  window.matchMedia = window.matchMedia || fakeMatchMedia

  wrapXHR(window, networkWriter)
  adjustXPathResult(window)
  fixMatchesDontThrow(window)
}
