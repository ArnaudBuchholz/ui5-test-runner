(function () {
  'use strict'

  if (window['ui5-test-runner/post']) {
    return
  }

  const base = window['ui5-test-runner/base-host'] || ''

  let lastPost = Promise.resolve()

  window['ui5-test-runner/post'] = function post (url, data) {
    function request () {
      return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', base + '/_/' + url)
        xhr.setRequestHeader('x-page-url', location)
        xhr.send(JSON.stringify(data))
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
