(function () {
  'use strict'

  const MODULE = 'ui5-test-runner/ui5-coverage'
  if (window[MODULE]) {
    return // already installed
  }
  window[MODULE] = true

  // inspired from ui5/resources/sap/ui/qunit/qunit-coverage-istanbul-dbg.js

  function appendUrlParameter (url) {
    const urlObject = new URL(url, document.baseURI)
    urlObject.searchParams.set('instrument', 'true')
    return urlObject.toString()
  }

  const nativeSetAttribute = HTMLScriptElement.prototype.setAttribute
  HTMLScriptElement.prototype.setAttribute = function (name, value) {
    if (name === 'data-sap-ui-module') {
      this.src = appendUrlParameter(this.src)
    }
    nativeSetAttribute.apply(this, arguments)
  }

  const nativeXhrOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (method, url) {
    if (window.sap && window.sap.ui && window.sap.ui.loader && url && url.endsWith('.js')) {
      arguments[1] = appendUrlParameter(url)
    }
    nativeXhrOpen.apply(this, arguments)
  }
}())
