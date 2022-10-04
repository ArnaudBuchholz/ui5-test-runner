'use strict'

const { check, serve, body } = require('reserve')
const { probe, start, screenshot, stop } = require('../browsers')
const { fromObject } = require('../job')
const { join } = require('path')
const { stat, readFile } = require('fs/promises')
const { getOutput } = require('../output')
const EventEmitter = require('events')
const assert = require('assert/strict')
const { performance } = require('perf_hooks')
const { cleanDir, allocPromise, filename } = require('../tools')
const { $browsers } = require('../symbols')

let job
let output

function exit (code) {
  output.stop()
  process.exit(code)
}

function qUnitEndpoints (data) {
  const { endpoint } = data
  if (!this.calls) {
    this.calls = {}
  }
  if (!this.calls[endpoint]) {
    this.calls[endpoint] = 1
  } else {
    ++this.calls[endpoint]
  }
  if (endpoint === 'QUnit/done') {
    assert(this.calls['QUnit/begin'], 'QUnit/begin was triggered')
    assert(this.calls['QUnit/log'], 'QUnit/log was triggered')
    assert(this.calls['QUnit/testDone'], 'QUnit/testDone was triggered')
    return true
  }
}

const tests = [{
  label: 'Loads a page',
  url: 'basic.html',
  log: () => {}
}, {
  label: 'Local storage (1)',
  url: 'localStorage.html?value=1',
  log: ({ initial, modified }) => {
    assert(initial === undefined, 'The local storage starts empty')
    assert(modified === '1', 'The local storage can be used')
  }
}, {
  label: 'Local storage (2)',
  url: 'localStorage.html?value=2',
  log: ({ initial, modified }) => {
    assert(initial === undefined, 'The local storage starts empty')
    assert(modified === '2', 'The local storage can be used')
  }
}, {
  label: 'Timeout (100ms)',
  url: 'timeout.html?rate=100&wait=1000',
  log: ({ steps }) => {
    assert(steps.length > 8, 'The right number of steps is generated')
  }
}, {
  label: 'Timeout (250ms)',
  url: 'timeout.html?rate=250&wait=1250',
  log: ({ steps }) => {
    assert(steps.length > 3, 'The right number of steps is generated')
  }
}, {
  label: 'Console logs',
  for: capabilities => !!capabilities.console,
  url: 'console.html',
  log: async (data, url) => {
    const pageBrowser = job[$browsers][url]
    assert(!!pageBrowser)
    const { promise, resolve, reject } = allocPromise()
    function waitForConsoleLogs () {
      if (pageBrowser.console.count === 5) {
        pageBrowser.console.flush
          .then(async () => {
            const jsont = (await readFile(join(pageBrowser.reportDir, 'console.jsont'))).toString()
            const logs = jsont
              .split('\n')
              .filter(line => !!line)
              .map(line => {
                const json = JSON.parse(line)
                delete json.t
                return json
              })
            try {
              assert.deepEqual(logs, [{
                api: 'log',
                args: ['A simple string']
              }, {
                api: 'log',
                args: ['complex parameters', 1, true, { property: 'value' }]
              }, {
                api: 'warning',
                args: ['A warning']
              }, {
                api: 'error',
                args: ['An error']
              }, {
                api: 'info',
                args: ['An info']
              }])
              resolve()
            } catch (e) {
              reject(e)
            }
          })
      } else {
        setTimeout(waitForConsoleLogs, 250)
      }
    }
    waitForConsoleLogs()
    return promise
  }
}, {
  label: 'Screenshot',
  for: capabilities => !!capabilities.screenshot,
  url: 'screenshot.html',
  log: async (data, url) => {
    const fileName = await screenshot(job, url, 'screenshot')
    const fileInfo = await stat(fileName)
    assert(fileInfo.isFile(), 'The file was generated')
    assert(fileInfo.size > 1024, 'The file contains something')
  }
}, {
  label: 'Scripts (QUnit)',
  for: capabilities => !!capabilities.scripts,
  url: 'qunit.html',
  scripts: ['qunit-intercept.js', 'post.js', 'qunit-hooks.js'],
  endpoint: qUnitEndpoints
}, {
  label: 'Scripts (TestSuite)',
  for: capabilities => !!capabilities.scripts,
  url: 'testsuite.html',
  scripts: ['post.js', 'qunit-redirect.js'],
  endpoint: function (data) {
    assert(data.endpoint === 'addTestPages', 'addTestPages was triggered')
    assert(data.body.length === 2, 'Two pages received')
    const pages = [
      '/unit/unitTests.qunit.html',
      '/integration/opaTests.iframe.qunit.html'
    ]
    pages.forEach((page, index) => assert(data.body[index] === page, page))
    return true
  }
}, {
  label: 'Scripts (External QUnit)',
  for: capabilities => !!capabilities.scripts,
  url: 'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/unit/unitTests.qunit.html',
  scripts: ['qunit-intercept.js', 'post.js', 'qunit-hooks.js'],
  endpoint: qUnitEndpoints
}]

async function main () {
  const [,, browser, ...browserArgs] = process.argv
  const cwd = process.cwd()
  const reportDir = join(cwd, '.utr-capabilities')
  job = fromObject(cwd, {
    reportDir,
    url: 'http://localhost:80',
    browser,
    '--': browserArgs
  })
  output = getOutput(job)
  output.reportOnJobProgress()
  try {
    await probe(job)
  } catch (e) {
    output.wrap(() => console.error('Unable to probe'))
    exit(-1)
  }

  const listeners = []

  const configuration = await check({
    port: 0,
    mappings: [
      require('../cors'), {
        method: 'POST',
        match: '^/log$',
        custom: async (request, response) => {
          const listenerIndex = request.headers.referer.match(/\blistener=(\d+)/)[1]
          const listener = listeners[listenerIndex]
          listener.emit('log', JSON.parse(await body(request)))
          response.writeHead(200)
          response.end()
        }
      }, {
        method: 'POST',
        match: '^/_/(.*)',
        custom: async (request, response, endpoint) => {
          const listenerIndex = request.headers['x-page-url'].match(/\blistener=(\d+)/)[1]
          const listener = listeners[listenerIndex]
          listener.emit('endpoint', {
            endpoint,
            body: JSON.parse(await body(request))
          })
          response.writeHead(200)
          response.end()
        }
      }, {
        match: '^/(.*)',
        file: join(__dirname, '$1')
      }]
  })
  await new Promise(resolve => serve(configuration)
    .on('ready', ({ port }) => {
      job.port = port
      resolve()
    })
  )

  job.status = 'Running tests'

  const filteredTests = tests.filter((test) => !test.for || test.for(job.browserCapabilities))
  output.wrap(() => console.log('Number of tests :', filteredTests.length))

  let errors = 0

  const next = async () => {
    if (filteredTests.length === 0) {
      if (Object.keys(job[$browsers]).length === 0) {
        output.wrap(() => console.log('Done.'))
        if (errors) {
          output.wrap(() => console.error('Temporary folder', reportDir, 'not cleaned because of errors.'))
        } else {
          await cleanDir(reportDir)
        }
        exit(errors)
      }
      return
    }
    const { label, url, log, scripts, endpoint } = filteredTests.shift()

    const listenerIndex = listeners.length
    const listener = new EventEmitter()
    listeners.push(listener)
    let pageUrl
    if (url.startsWith('http')) {
      pageUrl = url
    } else {
      pageUrl = `http://localhost:${job.port}/${url}`
    }
    if (url.includes('?')) {
      pageUrl += `&listener=${listenerIndex}`
    } else {
      pageUrl += `?listener=${listenerIndex}`
    }

    const now = performance.now()
    const timeoutId = setTimeout(() => done('Timeout'), 10000)

    async function done (error) {
      if (done.called) {
        return
      }
      done.called = true
      clearTimeout(timeoutId)
      await stop(job, pageUrl)
      const timeSpent = Math.floor(performance.now() - now)
      if (error) {
        output.wrap(() => console.log('❌', label, `[${filename(pageUrl)}]`, error))
        ++errors
      } else {
        output.wrap(() => console.log('✔️', label, timeSpent, 'ms'))
      }
      await next()
    }

    listener.on('log', async data => {
      try {
        await log(data, pageUrl)
        done()
      } catch (e) {
        done(e)
      }
    })

    if (endpoint) {
      const context = {}
      listener.on('endpoint', async data => {
        try {
          if (await endpoint.call(context, data, pageUrl) === true) {
            done()
          }
        } catch (e) {
          done(e)
        }
      })
    }

    start(job, pageUrl, scripts)
      .catch(reason => done(reason))
      .then(() => {
        done('Failed')
      })
  }

  let parallel
  if (!job.browserCapabilities.parallel) {
    parallel = 1
  } else {
    parallel = 2
  }

  const testsCount = filteredTests.length
  for (let i = 0; i < Math.min(parallel, testsCount); ++i) {
    next()
  }
}

main()
  .catch(reason => {
    output.wrap(() => console.error(reason))
    exit(-1)
  })
