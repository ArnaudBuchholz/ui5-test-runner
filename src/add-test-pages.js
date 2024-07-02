'use strict'

const { stop } = require('./browsers')
const { URL } = require('url')
const { getOutput } = require('./output')
const { stripUrlHash } = require('./tools')

const addUrlParam = (url, param) => {
  if (url.includes(param)) {
    return url
  }
  if (url.includes('?')) {
    return url + '&' + param
  }
  return url + '?' + param
}

module.exports = {
  async addTestPages (job, url, data) {
    const { type, opa, module, pages, page } = data
    getOutput(job).debug('probe', `addTestPages from ${url}`, data)
    let testPageUrls
    if (type === 'none') {
      testPageUrls = []
    } else {
      let receivedPages
      if (type === 'qunit') {
        receivedPages = [page]
        if (job.splitOpa && opa && module) {
          if (module.ids && module.ids.length > 1) {
            receivedPages = module.ids.map(id => addUrlParam(stripUrlHash(page), `moduleId=${id}`))
          } else if (module.names && module.names.length > 1) {
            receivedPages = module.names.map(name => addUrlParam(stripUrlHash(page), `module=${name}`))
          }
        }
      } else {
        receivedPages = pages
      }
      receivedPages = receivedPages.map(relativeUrl => {
        const absoluteUrl = new URL(relativeUrl, url)
        return stripUrlHash(absoluteUrl.toString())
      })
      if (job.pageFilter) {
        const filter = new RegExp(job.pageFilter)
        testPageUrls = receivedPages.filter(name => name.match(filter))
      } else {
        testPageUrls = receivedPages
      }
      if (job.pageParams) {
        testPageUrls = testPageUrls.map(url => addUrlParam(url, job.pageParams))
      }
    }
    let member
    if (type === 'suite' && job.splitOpa) {
      member = 'url'
    } else {
      member = 'testPageUrls'
    }
    job[member] = testPageUrls.reduce((uniques, url) => {
      if (!uniques.includes(url)) {
        uniques.push(url)
      }
      return uniques
    }, job[member] || [])
    stop(job, url)
  }
}
