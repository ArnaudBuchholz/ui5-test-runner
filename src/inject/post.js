(function () {
  'use strict'

  const MODULE = 'ui5-test-runner/post'
  if (window[MODULE]) {
    return // already installed
  }

  const base = window['ui5-test-runner/base-host'] || ''
  const XHR = window.XMLHttpRequest

  let lastPost = Promise.resolve()

  function isUI5Object (obj) {
    return typeof obj === 'object' &&
      obj !== null &&
      typeof obj.getId === 'function' &&
      typeof obj.getMetadata === 'function'
  }

  function stringify (data) {
    const objects = []
    const referenced = []
    const ui5Summary = obj => {
      const id = obj.getId && obj.getId()
      const className = obj.getMetadata && obj.getMetadata() && obj.getMetadata().getName()
      return {
        'ui5:class': className,
        'ui5:id': id
      }
    }
    const simple = JSON.stringify(data, function (key, value) {
      if (typeof value === 'object' && value) {
        if (isUI5Object(value)) {
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
        if (isUI5Object(value)) {
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

  const xPageUrl = top.location.toString()

  window[MODULE] = function post (url, data) {
    function request () {
      return new Promise(function (resolve, reject) {
        const xhr = new XHR()
        xhr.addEventListener('load', () => {
          resolve(xhr.responseText)
        })
        xhr.addEventListener('error', () => {
          reject(xhr.statusText)
        })
        xhr.open('POST', base + '/_/' + url)
        xhr.setRequestHeader('x-page-url', xPageUrl)
        xhr.setRequestHeader('content-type', 'application/json')
        const json = stringify(data)
        xhr.send(json)
      })
    }
    lastPost = lastPost.then(request)
    if (!window.__unsafe__) {
      lastPost = lastPost
        .then(undefined, function (reason) {
          console.error('Failed to POST to ' + url + '\nreason: ' + reason.toString())
        })
    }
    return lastPost
  }
}())
