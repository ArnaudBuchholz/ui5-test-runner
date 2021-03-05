'use strict'

const { join } = require('path')
const { body } = require('reserve')
const { stop } = require('./browsers')
const { promisify } = require('util')
const { writeFile } = require('fs')
const writeFileAsync = promisify(writeFile)
const { Request, Response } = require('reserve')

const job = require('./job')

const filename = url => {
  return escape(url).replace(/\//g, '_')
}

function endpoint (implementation) {
  return async function (request, response) {
    response.writeHead(200)
    response.end()
    const [, url] = request.headers.referer.match(/http:\/\/[^/]+(?::\d+)?(\/.*)/)
    const data = JSON.parse(await body(request))
    try {
      await implementation.call(this, url, data)
    } catch (e) {
      console.error(`Exception when processing ${url}`)
      console.error(data)
      console.error(e)
    }
  }
}

if (!job.parallel) {
  module.exports = []
} else {
  module.exports = [{
    // Substitute qunit-redirect to extract test pages
    match: '/resources/sap/ui/qunit/qunit-redirect.js',
    file: join(__dirname, './inject/qunit-redirect.js')
  }, {
    // Endpoint to receive test pages
    match: '/_/addTestPages',
    custom: endpoint((url, data) => {
      job.testPageUrls = data
      stop(url)
    })
  }, {
    // QUnit hooks
    match: '/_/qunit-hooks.js',
    file: join(__dirname, './inject/qunit-hooks.js')
  }, {
    // Concatenate qunit.js source with hooks
    match: /\/thirdparty\/(qunit(?:-2)?\.js)/,
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
    match: '/_/QUnit/begin',
    custom: endpoint((url, details) => {
      const page = job.testPages[url]
      Object.assign(page, {
        total: details.totalTests,
        failed: 0,
        passed: 0
      })
    })
  }, {
    // Endpoint to receive QUnit.testDone
    match: '/_/QUnit/testDone',
    custom: endpoint((url, report) => {
      const page = job.testPages[url]
      if (report.failed) {
        ++page.failed
      } else {
        ++page.passed
      }
      page.tests.push(report)
    })
  }, {
    // Endpoint to receive QUnit.done
    match: '/_/QUnit/done',
    custom: endpoint((url, report) => {
      const page = job.testPages[url]
      page.report = report
      const promise = writeFileAsync(join(job.tstReportDir, `${filename(url)}.json`), JSON.stringify(page))
      page.wait.then(promise).then(() => stop(url))
    })
  }, {
    // Endpoint to receive coverage
    match: '/_/nyc/coverage',
    custom: endpoint((url, data) => {
      const page = job.testPages[url]
      const promise = writeFileAsync(join(job.covTempDir, `${filename(url)}.json`), JSON.stringify(data))
      page.wait = page.wait.then(promise)
      return promise
    })
  }, {
    // UI to follow progress
    match: '/_/progress.html',
    file: join(__dirname, 'progress.html')
  }, {
    // Endpoint to follow progress
    match: '/_/progress',
    custom: async (request, response) => {
      const json = JSON.stringify(job, (key, value) => {
        if (key === 'tests' && Array.isArray(value)) {
          return undefined // Filter out
        }
        return value
      })
      response.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': json.length
      })
      response.end(json)
    }
  }]
}
