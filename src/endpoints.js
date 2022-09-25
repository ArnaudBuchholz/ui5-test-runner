'use strict'

const { join } = require('path')
const { body } = require('reserve')
const { extractPageUrl } = require('./tools')
const { Request, Response } = require('reserve')
const { getOutput } = require('./output')
const { begin, log, testDone, done } = require('./qunit-hooks')
const { addTestPages } = require('./add-test-pages')

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

  return job.parallel
    ? [{
      // Substitute qunit-redirect to extract test pages
        match: '/resources/sap/ui/qunit/qunit-redirect.js',
        file: join(__dirname, './inject/qunit-redirect.js')
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
          const hooksRequest = new Request('GET', '/_/qunit-hooks.js')
          const hooksResponse = new Response()
          await Promise.all([
            this.configuration.dispatch(ui5Request, ui5Response),
            this.configuration.dispatch(hooksRequest, hooksResponse)
          ])
          const hooksLength = parseInt(hooksResponse.headers['content-length'], 10)
          const ui5Length = parseInt(ui5Response.headers['content-length'], 10)
          response.writeHead(ui5Response.statusCode, {
            ...ui5Response.headers,
            'content-length': ui5Length + hooksLength,
            'cache-control': 'no-store' // for debugging purpose
          })
          response.write(ui5Response.toString())
          response.end(hooksResponse.toString())
        }
      }, {
      // Endpoint to receive QUnit.begin
        match: '^/_/QUnit/begin',
        custom: endpoint('QUnit/begin', (url, details) => begin(job, url, details))
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
        file: join(__dirname, 'progress.html')
      }, {
      // Endpoint to follow progress
        match: '^/_/progress',
        custom: async (request, response) => {
          const json = JSON.stringify(job, undefined, 2)
          const length = (new TextEncoder().encode(json)).length
          response.writeHead(200, {
            'Content-Type': 'application/json',
            'Content-Length': length
          })
          response.end(json)
        }
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
