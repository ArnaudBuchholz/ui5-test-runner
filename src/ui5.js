'use strict'

const { dirname, join } = require('path')
const { createWriteStream, mkdir } = require('fs')
const { promisify } = require('util')
const mkdirAsync = promisify(mkdir)
const { capture } = require('reserve')

const job = require('./job')

const [, hostName, version] = /https?:\/\/([^/]*)\/.*(\d+\.\d+\.\d+)?$/.exec(job.ui5)
const cacheBase = join(job.cwd, job.cache, hostName, version || '')
const match = /\/((?:test-)?resources\/.*)/
const ifCacheEnabled = (request, url, match) => job.cache ? match : false
const cacheInProgress = {}

module.exports = [{
  // Avoid reading UI5 file while it's being written
  match,
  'if-match': ifCacheEnabled,
  custom: async (request, response, path) => {
    const cachingPromise = cacheInProgress[path]
    if (cachingPromise) {
      await cachingPromise
    }
  }
}, {
  // UI5 from cache
  match,
  'if-match': ifCacheEnabled,
  file: `${cacheBase}/$1`,
  'ignore-if-not-found': true
}, {
  // UI5 caching
  method: 'GET',
  match,
  'if-match': ifCacheEnabled,
  custom: async (request, response, path) => {
    const cachePath = join(cacheBase, path)
    const cacheFolder = dirname(cachePath)
    await mkdirAsync(cacheFolder, { recursive: true })
    const file = createWriteStream(cachePath)
    cacheInProgress[path] = capture(response, file)
      .catch(reason => {
        console.error(`Unable to cache ${cachePath}`, reason)
      })
      .then(() => {
        delete cacheInProgress[path]
      })
  }
}, {
  // UI5 from url
  method: ['GET', 'HEAD'],
  match,
  url: `${job.ui5}/$1`
}]
