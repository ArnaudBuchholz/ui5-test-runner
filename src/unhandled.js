'use strict'

const { extractUrl } = require('./tools')

module.exports = [{
  custom: ({ headers, method, url }, response) => {
    if (method === 'GET' && url.match(/favicon\.ico$|-preload\.js$|-dbg(\.[^.]+)*\.js$|i18n_\w+\.properties$/)) {
      return 404 // expected
    }
    if (method === 'GET') {
      console.warn(`?? ${extractUrl(headers)} 404 ${method} ${url}`)
      return 404
    }
    console.error(`!! ${extractUrl(headers)} 500 ${method} ${url}`)
    return 500
  }
}]
