'use strict'

const { join } = require('path')
const { body } = require('reserve')
const { stop } = require('../browsers')
const { promisify } = require('util')
const { writeFile } = require('fs')
const writeFileAsync = promisify(writeFile)

function endpoint (implementation) {
  return async function (request, response) {
    response.writeHead(200)
    response.end()
    const id = request.headers.referer.match(/__id__=(\d+)/)[1]
    const data = JSON.parse(await body(request))
    try {
      await implementation.call(this, id, data)
    } catch (e) {
      console.error(`Exception when processing ${request.url} with id ${id}`)
      console.error(data)
      console.error(e)
    }
  }
}

module.exports = job => {
  if (!job.parallel) {
    return []
  }
  return [{
    // Substitute qunit-redirect to extract test pages
    match: '/resources/sap/ui/qunit/qunit-redirect.js',
    file: join(__dirname, '../inject/qunit-redirect.js')
  }, {
    // Endpoint to receive test pages
    match: '/_/addTestPages',
    custom: endpoint((id, data) => {
      job.testPageUrls = data
      stop(id)
    })
  }, {
    // QUnit hooks
    match: '/_/qunit-hooks.js',
    file: join(__dirname, '../inject/qunit-hooks.js')
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
    // Endpoint to receive QUnit test result
    match: '/_/QUnit/testDone',
    custom: endpoint((id, data) => {
      job.testPagesById[id].tests.push(data)
    })
  }, {
    // Endpoint to receive QUnit end
    match: '/_/QUnit/done',
    custom: endpoint((id, data) => {
      const page = job.testPagesById[id]
      page.report = data
      page.wait.then(() => stop(id))
    })
  }, {
    // Endpoint to receive coverage
    match: '/_/nyc/coverage',
    custom: endpoint((id, data) => {
      const page = job.testPagesById[id]
      const promise = writeFileAsync(join(job.cwd, job.covTempDir, `${id}.json`), JSON.stringify(data))
      page.wait = page.wait.then(promise)
      return promise
    })
  }]
}
