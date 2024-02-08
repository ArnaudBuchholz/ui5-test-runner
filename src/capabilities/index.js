'use strict'

const { check, serve, body } = require('reserve')
const { probe, start, stop } = require('../browsers')
const { join } = require('path')
const { getOutput } = require('../output')
const { performance } = require('perf_hooks')
const { cleanDir, allocPromise, filename } = require('../tools')
const { $browsers } = require('../symbols')
const tests = require('./tests')

async function capabilities (job) {
  const output = getOutput(job)

  async function exit (code) {
    if (job.keepAlive) {
      job.status = 'Serving'
    } else {
      if (job.debugKeepReport) {
        output.wrap(() => console.log('Report folder', job.reportDir, 'not cleaned because of --debug-keep-report.'))
      } else if (code !== 0) {
        output.wrap(() => console.error('Report folder', job.reportDir, 'not cleaned because of errors.'))
      } else {
        await cleanDir(job.reportDir)
      }
      output.stop()
      process.exit(code)
    }
  }

  try {
    output.reportOnJobProgress()
    try {
      await probe(job)
    } catch (e) {
      output.wrap(() => console.error('Unable to probe'))
      exit(-1)
    }

    const listeners = []

    const configuration = await check({
      port: job.port,
      mappings: [
        require('../cors'), {
          custom: async (request, response) => {
            response.setHeader('x-ui5-test-runner', 'capabilities')
          }
        }, {
          match: /x-wait-time=(\d+)/,
          custom: async (request, response, waitTime) => {
            response.setHeader('x-wait-time', waitTime)
            await new Promise(resolve => setTimeout(resolve, parseInt(waitTime)))
          }
        }, {
          method: 'POST',
          match: '^/_/(.*)',
          custom: async (request, response, endpoint) => {
            const { referer, 'x-page-url': xPageUrl } = request.headers
            const listenerIndex = (xPageUrl || referer).match(/\blistener=(\d+)/)[1]
            const listener = listeners[listenerIndex]
            await listener({
              endpoint,
              body: JSON.parse(await body(request))
            })
            response.writeHead(200)
            response.end()
          }
        }, {
          match: '^/inject/(.*)',
          file: join(__dirname, '../inject/$1')
        }, {
          match: '^/(.*)',
          file: join(__dirname, '$1')
        }]
    })
    const server = serve(configuration)
    if (job.logServer) {
      server.on('redirected', output.redirected)
    }
    await new Promise(resolve => server
      .on('ready', ({ port }) => {
        job.port = port
        resolve()
      })
    )

    job.status = 'Running tests'

    const filteredTests = tests
      .filter((test) => !test.for || test.for(job.browserCapabilities))
      .filter(({ name }) => !job.debugCapabilitiesTest || name.startsWith(job.debugCapabilitiesTest))
    output.wrap(() => console.log('Number of tests :', filteredTests.length))

    let errors = 0

    const { promise: forEver } = allocPromise()

    const next = async () => {
      if (filteredTests.length === 0) {
        if (!job[$browsers] || Object.keys(job[$browsers]).length === 0) {
          output.wrap(() => console.log('Done.'))
          exit(errors)
        }
        return
      }
      const { label, url, scripts, endpoint = () => { } } = filteredTests.shift()

      const listenerIndex = listeners.length
      let pageUrl
      if (url.startsWith('http')) {
        pageUrl = url
      } else {
        pageUrl = `http://localhost:${job.port}/tests/${url}`
      }
      if (url.includes('?')) {
        pageUrl += `&listener=${listenerIndex}`
      } else {
        pageUrl += `?listener=${listenerIndex}`
      }

      const now = performance.now()
      let timeoutId
      if (!job.debugCapabilitiesNoTimeout) {
        const timeout = job.pageTimeout || 120000
        timeoutId = setTimeout(() => done(`Timeout (${timeout})`), timeout)
      }

      async function done (error) {
        if (done.called) {
          return
        }
        done.called = true
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        await stop(job, pageUrl)
        const timeSpent = Math.floor(performance.now() - now)
        if (error) {
          output.wrap(() => console.log('❌', label, `[${filename(pageUrl)}]`, error))
          if (job.failFast) {
            exit(1)
          }
          ++errors
        } else {
          output.wrap(() => console.log('✔️', label, timeSpent, 'ms'))
        }
        await next()
      }

      const context = {
        job
      }
      listeners[listenerIndex] = async data => {
        try {
          if (await endpoint.call(context, data, pageUrl) !== false) {
            done()
          }
        } catch (e) {
          done(e)
        }
      }

      start(job, pageUrl, scripts)
        .catch(reason => done(reason))
        .then(() => {
          if (!context.stopExpected) {
            done('Failed')
          }
        })
    }

    let parallel
    if (!job.browserCapabilities.parallel) {
      parallel = 1
    } else {
      parallel = job.parallel
    }

    const testsCount = filteredTests.length
    for (let i = 0; i < Math.max(Math.min(parallel, testsCount), 1); ++i) {
      next()
    }

    await forEver
  } catch (error) {
    output.wrap(() => console.error(error))
    exit(-1)
  }
}

module.exports = {
  capabilities
}
