(function () {
  'use strict'

  const MODULE = 'ui5-test-runner/post'
  if (window[MODULE]) {
    return // already installed
  }

  const base = window['ui5-test-runner/base-host'] || ''
  const probe = window['ui5-test-runner/probe'] || false
  const batchSize = !probe && (window['ui5-test-runner/batch'] || 0)

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
          return {
            'circular:id': id,
            ...value
          }
        }
      }
      return value
    })
  }

  window['ui5-test-runner/stringify'] = stringify

  const xPageUrl = top.location.toString()

  const nativeFetch = window.fetch
  let request
  if (nativeFetch) {
    request = async function (url, data) {
      const response = await nativeFetch(base + '/_/' + url, {
        method: 'POST',
        headers: {
          'x-page-url': xPageUrl,
          'content-type': 'application/json'
        },
        body: stringify(data)
      })
      if (response.status !== 200) {
        throw response.statusText
      }
      return response.text()
    }
  } else {
    const XHR = window.XMLHttpRequest
    request = function (url, data) {
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
  }

  function post (url, data) {
    lastPost = lastPost.then(() => request(url, data))
    if (!window.__unsafe__) {
      lastPost = lastPost
        .then(undefined, function (reason) {
          console.error('Failed to POST to ' + url + '\nreason: ' + reason.toString())
        })
    }
    return lastPost
  }

  const aggregatedData = []

  function batch (url, data) {
    aggregatedData.push([url, data])
    if (url === 'QUnit/done' || aggregatedData.length === batchSize) {
      post('QUnit/batch', [...aggregatedData])
      aggregatedData.length = 0
    }
  }

  window[MODULE] = batchSize ? batch : post
}())
