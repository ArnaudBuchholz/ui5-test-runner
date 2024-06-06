const noop = () => {}

function fakeMatchMedia () {
  return {
    matches: false,
    addListener: noop,
    removeListener: noop
  }
}

function wrapXHR ({ XMLHttpRequest }) {
  const { open, send } = XMLHttpRequest.prototype
  const $async = Symbol('async')
  XMLHttpRequest.prototype.open = function (...args) {
    const [method, url, async] = args
    const log = () => {
      const { status } = this
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        channel: 'network',
        initiator: 'xhr',
        method,
        url,
        async,
        status
      }))
    }
    this.addEventListener('load', log)
    this.addEventListener('error', log)
    if (async === false) {
      this[$async] = { method, url }
    }
    return open.call(this, ...args)
  }
  XMLHttpRequest.prototype.send = function (...args) {
    if (this[$async]) {
      const { method, url } = this[$async]
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        channel: 'debug',
        message: '>> XMLHttpRequest.prototype.send',
        method,
        url,
        async: false
      }))
    }
    const result = send.call(this, ...args)
    if (this[$async]) {
      const { method, url } = this[$async]
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        channel: 'debug',
        message: '<< XMLHttpRequest.prototype.send',
        method,
        url,
        async: false
      }))
    }
    return result
  }
}

function adjustXPathResult ({ Document }) {
  /* https://ui5.sap.com/resources/sap/ui/model/odata/AnnotationParser-dbg.js
     getXPath: function() {
       xmlNodes.length = xmlNodes.snapshotLength;
  */
  const { evaluate } = Document.prototype
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

function fixMatchesDontThrow ({ document }) {
  // https://github.com/jsdom/jsdom/issues/3057
  // Fix _nwsapiDontThrow which throws :-(
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

function fixCaseSensitiveSelectors ({ Document }) {
  const uppercaseTag = /\bSCRIPT\b/g
  const { querySelector, querySelectorAll } = Document.prototype
  Object.assign(Document.prototype, {
    querySelector (selectors) {
      const result = querySelector.call(this, selectors) || { length: 0 }
      if (result.length === 0 && selectors.match(uppercaseTag)) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          channel: 'debug',
          message: 'overriding selectors upon empty result of document.querySelector',
          selectors
        }))
        return querySelector.call(this, selectors.replace(uppercaseTag, tag => tag.toLowerCase()))
      }
      return result
    },

    querySelectorAll (selectors) {
      const result = querySelectorAll.call(this, selectors) || { length: 0 }
      if (result.length === 0 && selectors.match(uppercaseTag)) {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          channel: 'debug',
          message: 'overriding selectors upon empty result of document.querySelectorAll',
          selectors
        }))
        return querySelectorAll.call(this, selectors.replace(uppercaseTag, tag => tag.toLowerCase()))
      }
      return result
    }
  })
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
  adjustXPathResult(window)
  fixMatchesDontThrow(window)
  fixCaseSensitiveSelectors(window)
}
