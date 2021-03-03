'use strict'

const { dirname, join } = require('path')
const { createWriteStream, mkdir } = require('fs')
const { promisify } = require('util')
const mkdirAsync = promisify(mkdir)
const { capture } = require('reserve')

module.exports = job => {
  const [, hostName, version] = /https?:\/\/([^/]*)\/.*(\d+\.\d+\.\d+)?$/.exec(job.ui5)
  const cacheBase = join(job.cwd, job.cache, hostName, version || '')
  const ifCacheEnabled = (request, url, match) => job.cache ? false : match

  return [{
    // UI5 from cache
    match: /\/((?:test-)?resources\/.*)/,
    'if-match': ifCacheEnabled,
    file: `${cacheBase}/$1`,
    'ignore-if-not-found': true
  }, {
    // UI5 caching
    method: 'GET',
    match: /\/((?:test-)?resources\/.*)/,
    'if-match': ifCacheEnabled,
    custom: async (request, response, path) => {
      const cachePath = join(cacheBase, path)
      const cacheFolder = dirname(cachePath)
      await mkdirAsync(cacheFolder, { recursive: true })
      const file = createWriteStream(cachePath)
      capture(response, file)
        .catch(reason => {
          console.error(`Unable to cache ${cachePath}`, reason)
        })
    }
  }, {
    // UI5 from url
    method: ['GET', 'HEAD'],
    match: /\/((?:test-)?resources\/.*)/,
    url: `${job.ui5}/$1`
  }]
}
