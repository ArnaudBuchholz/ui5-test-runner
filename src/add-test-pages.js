'use strict'

const { stop } = require('./browsers')
const { URL } = require('url')

module.exports = {
  async addTestPages (job, url, pages) {
    let testPageUrls
    pages = pages.map(relativeUrl => {
      const absoluteUrl = new URL(relativeUrl, url)
      return absoluteUrl.toString()
    })
    if (job.pageFilter) {
      const filter = new RegExp(job.pageFilter)
      testPageUrls = pages.filter(name => name.match(filter))
    } else {
      testPageUrls = pages
    }
    if (job.pageParams) {
      testPageUrls = testPageUrls.map(url => {
        if (url.includes('?')) {
          return url + '&' + job.pageParams
        }
        return url + '?' + job.pageParams
      })
    }
    job.testPageUrls = testPageUrls.reduce((uniques, url) => {
      if (!uniques.includes(url)) {
        uniques.push(url)
      }
      return uniques
    }, [])
    stop(job, url)
  }
}
