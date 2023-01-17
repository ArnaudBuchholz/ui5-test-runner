'use strict'

const { join } = require('path')
const { body } = require('reserve')
const { extractPageUrl } = require('./tools')
const { Request, Response } = require('reserve')
const { getOutput } = require('./output')
const { begin, testStart, log, testDone, done } = require('./qunit-hooks')
const { addTestPages } = require('./add-test-pages')
const { getJobProgress } = require('./get-job-progress')
const { readFile } = require('fs/promises')
const { TextEncoder } = require('util')

module.exports = job => {
  async function endpointImpl (api, implementation, request) {
    const url = extractPageUrl(request.headers)
    const data = JSON.parse(await body(request))
    try {
      await implementation.call(this, url, data)
    } catch (error) {
      getOutput(job).endpointError({ api, url, data, error })
    }
  }

  function synchronousEndpoint (api, implementation) {
    return async function (request, response) {
      await endpointImpl(api, implementation, request)
      response.writeHead(200)
      response.end()
    }
  }

  function endpoint (api, implementation) {
    return async function (request, response) {
      response.writeHead(200)
      response.end()
      await endpointImpl(api, implementation, request)
    }
  }

  async function getInjects (...names) {
    return '\n;\n' + (await Promise.all(names.map(name => readFile(join(__dirname, 'inject', `${name}.js`)))))
      .map(buffer => buffer.toString())
      .join('\n;\n')
  }

  function contentLength (content) {
    return new TextEncoder().encode(content).length
  }

  function sendScript (response, content) {
    response.writeHead(200, {
      'content-type': 'text/javascript',
      'content-length': contentLength(content),
      'cache-control': 'no-store'
    })
    response.end(content)
  }

  return job.parallel
    ? [{
      // Substitute qunit-redirect to extract test pages
        match: '/resources/sap/ui/qunit/qunit-redirect.js',
        custom: async (request, response) => {
          sendScript(response, await getInjects('post', 'qunit-redirect'))
        }
      }, {
      // Endpoint to receive test pages
        match: '^/_/addTestPages',
        custom: endpoint('addTestPages', (url, pages) => addTestPages(job, url, pages))
      }, {
      // QUnit hooks
        match: '^/_/qunit-hooks.js',
        file: join(__dirname, './inject/qunit-hooks.js')
      }, {
      // Concatenate qunit.js source with hooks
        match: /\/thirdparty\/(qunit(?:-2)?(?:-dbg)?\.js)/,
        custom: async function (request, response, scriptName) {
          if (request.internal) {
            return // ignore to avoid infinite loop
          }
          const ui5Request = new Request('GET', request.url)
          ui5Request.internal = true
          const ui5Response = new Response()
          const [inject] = await Promise.all([
            getInjects('post', 'qunit-hooks'),
            this.configuration.dispatch(ui5Request, ui5Response)
          ])
          const hooksLength = contentLength(inject)
          const ui5Length = parseInt(ui5Response.headers['content-length'], 10)
          response.writeHead(ui5Response.statusCode, {
            ...ui5Response.headers,
            'content-length': ui5Length + hooksLength,
            'cache-control': 'no-store' // for debugging purpose
          })
          response.write(ui5Response.toString())
          response.end(inject)
        }
      }, {
      // Endpoint to receive QUnit.begin
        match: '^/_/QUnit/begin',
        custom: endpoint('QUnit/begin', (url, details) => begin(job, url, details))
      }, {
      // Endpoint to receive QUnit.testStart
        match: '^/_/QUnit/testStart',
        custom: endpoint('QUnit/testStart', (url, details) => testStart(job, url, details))
      }, {
      // Endpoint to receive QUnit.log
        match: '^/_/QUnit/log',
        custom: synchronousEndpoint('QUnit/log', async (url, report) => log(job, url, report))
      }, {
      // Endpoint to receive QUnit.testDone
        match: '^/_/QUnit/testDone',
        custom: synchronousEndpoint('QUnit/testDone', async (url, report) => testDone(job, url, report))
      }, {
      // Endpoint to receive QUnit.done
        match: '^/_/QUnit/done',
        custom: endpoint('QUnit/done', async (url, report) => done(job, url, report))
      }, {
      // UI to follow progress
        match: '^/_/progress.html',
        file: job.progressPage
      }, {
      // Report 'main' substituted for progress
        match: '^/_/report/main.js',
        file: join(__dirname, 'defaults/report/progress.js')
      }, {
      // Other report resources
        match: '^/_/report/(.*)',
        file: join(__dirname, 'defaults/report/$1')
      }, {
      // punybind
        match: '^/_/punybind.js',
        file: join(__dirname, '../node_modules/punybind/dist/punybind.js')
      }, {
      // punyexpr
        match: '^/_/punyexpr.js',
        file: join(__dirname, '../node_modules/punyexpr/dist/punyexpr.js')
      }, {
      // Endpoint to follow progress
        match: '^/_/progress(?:\\?page=(.*))?',
        custom: (request, response, pageId) => getJobProgress(job, request, response, pageId)
      }, {
      // Endpoint to coverage files
        match: '^/_/coverage/(.*)',
        file: join(job.coverageReportDir, '$1')
      }, {
      // Endpoint to report
        match: '^/_/report.html',
        file: join(__dirname, 'report.html')
      }, {
      // Endpoint to report files
        match: '^/_/(.*)',
        file: join(job.reportDir, '$1')
      }]
    : []
}
