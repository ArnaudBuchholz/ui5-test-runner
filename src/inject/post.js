(function () {
  'use strict'

  if (window['ui5-test-runner/post']) {
    return
  }

  const base = window['ui5-test-runner/base-host'] || ''

  let lastPost = Promise.resolve()
  let UI5Object

  function stringify (data) {
    const objects = []
    const referenced = []
    if (!UI5Object && typeof window.sap === 'object') {
      UI5Object = window.sap.ui.base.Object
    }
    const ui5Summary = obj => {
      const id = obj.getId && obj.getId()
      const className = obj.getMetadata().getName()
      return {
        'ui5:class': className,
        'ui5:id': id
      }
    }
    const simple = JSON.stringify(data, function (key, value) {
      if (typeof value === 'object' && value) {
        if (UI5Object && value instanceof UI5Object) {
          return ui5Summary(value)
        }
        const id = objects.indexOf(value)
        if (id !== -1) {
          referenced[id] = true
          return null // Skip error and check all references
        }
        objects.push(value)
      }
      return value
    })
    if (referenced.length === 0) {
      return simple
    }
    const stringified = []
    return JSON.stringify(data, function (key, value) {
      if (typeof value === 'object' && value) {
        if (UI5Object && value instanceof UI5Object) {
          return ui5Summary(value)
        }
        const id = objects.indexOf(value)
        if (referenced[id]) {
          if (stringified[id]) {
            return { 'circular:ref': id }
          }
          stringified[id] = true
          if (Array.isArray(value)) {
            return {
              'circular:id': id,
              'circular:array': [].concat(value) // 'new' object
            }
          }
          return Object.assign({
            'circular:id': id
          }, value)
        }
      }
      return value
    })
  }

  window['ui5-test-runner/stringify'] = stringify

  window['ui5-test-runner/post'] = function post (url, data) {
    function request () {
      return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', base + '/_/' + url)
        xhr.setRequestHeader('x-page-url', location)
        xhr.send(stringify(data))
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
    lastPost = lastPost
      .then(undefined, function (reason) {
        console.error('Failed to POST to ' + url + '\nreason: ' + reason.toString())
        throw new Error('failed')
      })
      .then(request)
    return lastPost
  }
}())
