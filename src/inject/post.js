(function () {
  'use strict'

  if (window['ui5-test-runner/post']) {
    return
  }

  const base = window['ui5-test-runner/base-host'] || ''

  let lastPost = Promise.resolve()

  function stringify (data) {
    const objects = []

    function store (value) {
      objects.push(value)
      value.__circular_uses__ = 0
      value.__circular_id__ = objects.length - 1
    }

    if (typeof data === 'object' && data) {
      store(data)
    }

    let result = JSON.stringify(data, function (key, value) {
      if (typeof value === 'object' && value && key) {
        const id = objects.indexOf(value)
        if (id === -1) {
          store(value)
          return value
        }
        ++objects[id].__circular_uses__
        return {
          __circular_ref__: id
        }
      }
      return value
    }).replace(/"__circular_uses__":\d+,/g, '')

    objects.forEach((object, id) => {
      if (object.__circular_uses__ === 0) {
        result = result.replace(new RegExp(',?"__circular_id__":' + id), '')
      }
    })

    return result // .replace(/,}/g, '}')
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
