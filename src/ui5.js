'use strict'

const { dirname, join } = require('path')
const { createWriteStream } = require('fs')
const { mkdir, unlink, stat, readdir } = require('fs').promises
const { capture } = require('reserve')
const { getOutput, newProgress } = require('./output')
const { download } = require('./tools')
const { $statusProgressCount, $statusProgressTotal } = require('./symbols')
const { parallelize } = require('./parallelize')
const { relative: relativePath } = require('path')

const buildCacheBase = job => {
  const [, hostName] = /https?:\/\/([^/]*)/.exec(job.ui5)
  const [, version] = /(\d+\.\d+\.\d+)?$/.exec(job.ui5)
  return join(job.cache || '', hostName.replace(':', '_'), version || '')
}

const ui5mappings = job => {
  const cacheBase = buildCacheBase(job)
  const match = /\/((?:test-)?resources\/.*)/
  const ifCacheEnabled = (request, url, match) => job.cache
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
    cwd: cacheBase,
    file: '$1',
    static: !job.debugDevMode
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

  for (let { relative, source } of job.libs) {
    if (source.endsWith('/') || source.endsWith('\\')) {
      source = source.substring(0, source.length - 1)
    }
    const relativeUrl = relative.replace(/\//g, '\\/')
    if (source.startsWith(job.webapp)) {
      const relativeAbsoluteUrl = '/' + relativePath(job.webapp, source).replace(/\\/g, '/')
      getOutput(job).debug('libs', `${relative} maps to webapp sub directory, use internal redirection to ${relativeAbsoluteUrl}`)
      mappings.unshift({
        match: new RegExp(`\\/resources\\/${relativeUrl}(.*)`),
        custom: (request, response, $1) => `${relativeAbsoluteUrl}${$1}`
      })
    } else {
      mappings.unshift({
        match: new RegExp(`\\/resources\\/${relativeUrl}(.*)`),
        cwd: source,
        file: '$1',
        static: !job.watch && !job.debugDevMode
      }, {
        match: new RegExp(`\\/resources\\/${relativeUrl}(.*)`),
        custom: (request, response, $1) => {
          if ($1 === undefined) {
            getOutput(job).debug('libs', `Unable to map ${relative} : $1 is undefined`)
          } else {
            getOutput(job).debug('libs', `Unable to map ${relative}/${$1} to ${join(source, $1)}`)
          }
          return 404
        }
      })
    }
  }

  return mappings
}

const openui5mappings = async job => {
  const output = getOutput(job)
  output.serveOpenUI5()

  const basePath = join(job.cwd, 'src')

  const mappings = []

  const map = (base, path, deep) => {
    const matchSubPath = deep ? '([^?]*)' : '([^/?]*)'
    const match = new RegExp(`/resources\\/${base.replaceAll(/\//g, '\\/')}${matchSubPath}(?:\\?.*)?$`)
    return [{
      match,
      custom: (request, _, captured) => {
        output.log(request.url, match, path + '/' + captured)
      }
    }, {
      match,
      file: '$1',
      cwd: join(basePath, path),
      static: true
    }]
  }

  const folders = await readdir(basePath)
  const namespaces = folders.filter(name => name.startsWith('sap.'))

  for (const namespace of namespaces) {
    if (namespace === 'sap.ui.core') {
      break // sap.ui.core needs special handling
    }
    const path = namespace.replaceAll(/\./g, '/')
    mappings.push(...map(path + '/', `${namespace}/src/${path}`, true))
  }
  mappings.push(...map('', 'sap.ui.core/src', false))
  mappings.push(...map('sap/base/', 'sap.ui.core/src/sap/base', true))
  mappings.push(...map('sap/ui/', 'sap.ui.core/src/sap/ui', true))

  return mappings
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

    const lib = async name => {
      progress.label = name
      progress.count = 0
      const libPath = name.replace(/\./g, '/') + '/'
      const { resources } = require(await get(libPath + 'resources.json'))
      progress.total = resources.length
      progress.label = `${name} (${resources.length} files)`
      await parallelize(async ({ name, size }) => {
        await get(libPath + name, size)
        ++progress.count
      }, resources, 8)
      ++job[$statusProgressCount]
    }

    job.status = 'Preloading UI5'
    job[$statusProgressCount] = 0
    job[$statusProgressTotal] = job.preload.length + 1
    await get('sap-ui-version.json')
    await get('sap-ui-core.js')
    const progress = newProgress(job)
    await parallelize(lib, ['sap.ui.core', ...job.preload], 1)
    progress.done()
  },

  mappings: async job => {
    if (job.openui5) {
      return await openui5mappings(job)
    }
    if (job.disableUi5) {
      return []
    }
    return ui5mappings(job)
  }
}
