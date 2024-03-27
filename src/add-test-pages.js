'use strict'

const { stop } = require('./browsers')
const { URL } = require('url')
const { getOutput } = require('./output')
const { stripUrlHash } = require('./tools')

const addUrlParam = (url, param) => {
  if (url.includes('?')) {
    return url + '&' + param
  }
  return url + '?' + param
}

module.exports = {
  async addTestPages (job, url, data) {
    const { type, opa, modules, pages, page } = data
    getOutput(job).debug('probe', `addTestPages from ${url}`, data)
    let testPageUrls
    if (type === 'none') {
      testPageUrls = []
    } else {
      let receivedPages
      if (type === 'qunit') {
        if (job.splitOpa && opa && modules && modules.length > 1) {
          receivedPages = modules.map(moduleId => addUrlParam(stripUrlHash(page), `moduleId=${moduleId}`))
        } else {
          receivedPages = [page]
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
    job.testPageUrls = testPageUrls.reduce((uniques, url) => {
      if (!uniques.includes(url)) {
        uniques.push(url)
      }
      return uniques
    }, job.testPageUrls || [])
    stop(job, url)
  }
}
