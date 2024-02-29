'use strict'

const { dirname, join } = require('path')
const { createWriteStream } = require('fs')
const { mkdir, unlink, stat } = require('fs').promises
const { capture } = require('reserve')
const { getOutput } = require('./output')
const { download, allocPromise } = require('./tools')
const { $browsers } = require('./symbols')

const buildCacheBase = job => {
  const [, hostName] = /https?:\/\/([^/]*)/.exec(job.ui5)
  const [, version] = /(\d+\.\d+\.\d+)?$/.exec(job.ui5)
  return join(job.cache || '', hostName.replace(':', '_'), version || '')
}

module.exports = {
  preload: async job => {
    const cacheBase = buildCacheBase(job)
    const get = async (path, expectedSize) => {
      const filePath = join(cacheBase, 'resources/' + path)
      try {
        const info = await stat(filePath)
        if (expectedSize !== undefined && info.isFile() && info.size === expectedSize) {
          return filePath
        }
      } catch (e) {
        // ignore
      }
      return download((new URL('resources/' + path, job.ui5)).toString(), filePath)
    }
    const progress = { count: 1, passed: 0, failed: 0 }

    const lib = async name => {
      const { promise, resolve/*, reject */ } = allocPromise()

      job.status = `Preloading UI5 (${name})`
      const libPath = name.replace(/\./g, '/') + '/'
      const { resources } = require(await get(libPath + 'resources.json'))
      progress.passed = 0
      progress.count = resources.length
      let index = 0
      let active = 0

      const task = async () => {
        ++active
        const { name, size } = resources[index++]
        await get(libPath + name, size)
        ++progress.passed
        if (index < resources.length) {
          task()
        }
        if (--active === 0) {
          resolve()
        }
      }

      task()
      task()
      task()
      task()

      return promise
    }

    job.status = 'Preloading UI5'
    job[$browsers] = { [job.ui5]: {} }
    job.qunitPages = { [job.ui5]: progress }

    await get('sap-ui-version.json')
    await get('sap-ui-core.js')
    await lib('sap.ui.core')
    await lib('sap.m')

    await new Promise(resolve => setTimeout(resolve, 5000))
    throw 'STOP'
    delete job[$browsers]
    delete job.qunitPages
  },

  mappings: job => {
    if (job.disableUi5) {
      return []
    }

    const cacheBase = buildCacheBase(job)
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
              getOutput(job).failedToCacheUI5resource(path, response.statusCode)
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
      url: `${job.ui5}/$1`,
      'ignore-unverifiable-certificate': true
    }]

    job.libs.forEach(({ relative, source }) => {
      mappings.unshift({
        match: new RegExp(`\\/resources\\/${relative.replace(/\//g, '\\/')}(.*)`),
        file: join(source, '$1'),
        'ignore-if-not-found': true
      })
    })

    return mappings
  }
}
