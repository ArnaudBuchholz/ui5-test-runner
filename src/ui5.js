'use strict'

const { dirname, join } = require('path')
const { createWriteStream } = require('fs')
const { mkdir, unlink } = require('fs').promises
const { capture } = require('reserve')

module.exports = job => {
  const [, hostName, version] = /https?:\/\/([^/]*)(?:\/[^/]+)*\/(\d+\.\d+\.\d+)?$/.exec(job.ui5)
  const cacheBase = join(job.cwd, job.cache, hostName, version || '')
  const match = /\/((?:test-)?resources\/.*)/
  const ifCacheEnabled = (request, url, match) => job.cache ? match : false
  const uncachable = {}
  const cachingInProgress = {}

  const mappings = [{
    /* Prevent caching issues :
     * - Caching was not possible (99% URL does not exist)
     * - Caching is in progress (must wait for the end of the writing stream)
     */
    match,
    'if-match': ifCacheEnabled,
    custom: async (request, response, path) => {
      if (uncachable[path]) {
        response.writeHead(404)
        response.end()
        return
      }
      const cachingPromise = cachingInProgress[path]
      /* istanbul ignore next */ // Hard to reproduce
      if (cachingPromise) {
        await cachingPromise
      }
    }
  }, {
    // UI5 from cache
    match,
    'if-match': ifCacheEnabled,
    file: join(cacheBase, '$1'),
    'ignore-if-not-found': true
  }, {
    // UI5 caching
    method: 'GET',
    match,
    'if-match': ifCacheEnabled,
    custom: async (request, response, path) => {
      const filePath = /([^?#]+)/.exec(unescape(path))[1] // filter URL parameters & hash (assuming resources are static)
      const cachePath = join(cacheBase, filePath)
      const cacheFolder = dirname(cachePath)
      await mkdir(cacheFolder, { recursive: true })
      if (cachingInProgress[path]) {
        return request.url // loop back to use cached result
      }
      const file = createWriteStream(cachePath)
      cachingInProgress[path] = capture(response, file)
        .catch(reason => {
          file.end()
          uncachable[path] = true
          if (response.statusCode !== 404) {
            console.error(`Unable to cache '${path}' (status ${response.statusCode})`)
          }
          return unlink(cachePath)
        })
        .then(() => {
          delete cachingInProgress[path]
        })
    }
  }, {
    // UI5 from url
    method: ['GET', 'HEAD'],
    match,
    url: `${job.ui5}/$1`
  }]

  if (job.libs) {
    mappings.unshift({
      match: /\/resources\/(.*)/,
      file: join(job.libs, '$1'),
      'ignore-if-not-found': true
    })
  }

  return mappings
}
