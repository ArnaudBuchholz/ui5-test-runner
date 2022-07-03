(function () {
  'use strict'

  const base = window['ui5-test-runner/base-host'] || ''

  window['ui5-test-runner/post'] = function post (url, data) {
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
}())
