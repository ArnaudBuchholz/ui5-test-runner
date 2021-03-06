'use strict'

const { join } = require('path')
const { body } = require('reserve')
const { stop } = require('./browsers')
const { writeFile } = require('fs').promises
const { extractUrl, filename } = require('./tools')
const { Request, Response } = require('reserve')

module.exports = job => {
  function endpoint (implementation) {
    return async function (request, response) {
      response.writeHead(200)
      response.end()
      const url = extractUrl(request.headers)
      const data = JSON.parse(await body(request))
      if (job.parallel === -1) {
        console.log(url, data)
      }
      try {
        await implementation.call(this, url, data)
      } catch (e) {
        console.error(`Exception when processing ${url}`)
        console.error(data)
        console.error(e)
      }
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
        custom: endpoint(async (url, data) => {
          let testPageUrls
          if (job.pageFilter) {
            const filter = new RegExp(job.pageFilter)
            testPageUrls = data.filter(name => name.match(filter))
          } else {
            testPageUrls = data
          }
          if (job.pageParams) {
            testPageUrls = testPageUrls.map(url => {
              if (url.includes('?')) {
                return url + '&' + job.pageParams
              }
              return url + '?' + job.pageParams
            })
          }
          const pages = testPageUrls.reduce((mapping, page) => {
            mapping[page] = filename(page)
            return mapping
          }, {})
          const pagesFileName = join(job.tstReportDir, 'pages.json')
          await writeFile(pagesFileName, JSON.stringify(pages))
          job.testPageUrls = Object.keys(pages) // filter out duplicates
          stop(job, url)
        })
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
        custom: endpoint((url, details) => {
          job.testPages[url] = {
            total: details.totalTests,
            failed: 0,
            passed: 0,
            tests: []
          }
        })
      }, {
      // Endpoint to receive QUnit.testDone
        match: '^/_/QUnit/testDone',
        custom: endpoint((url, report) => {
          const page = job.testPages[url]
          if (report.failed) {
            job.failed = true
            ++page.failed
          } else {
            ++page.passed
          }
          page.tests.push(report)
        })
      }, {
      // Endpoint to receive QUnit.done
        match: '^/_/QUnit/done',
        custom: endpoint((url, report) => {
          let promise = Promise.resolve()
          const page = job.testPages[url]
          if (page) {
            if (report.__coverage__) {
              const coverageFileName = join(job.covTempDir, `${filename(url)}.json`)
              promise = writeFile(coverageFileName, JSON.stringify(report.__coverage__))
              delete report.__coverage__
            }
            page.report = report
          }
          promise.then(() => stop(job, url))
        })
      }, {
      // UI to follow progress
        match: '^/_/progress.html',
        file: join(__dirname, 'progress.html')
      }, {
      // Endpoint to follow progress
        match: '^/_/progress',
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
      }, {
      // Endpoint to coverage files
        match: '^/_/coverage/(.*)',
        file: join(job.covReportDir, '$1')
      }, {
      // Endpoint to report
        match: '^/_/report.html',
        file: join(__dirname, 'report.html')
      }, {
      // Endpoint to report files
        match: '^/_/(.*)',
        file: join(job.tstReportDir, '$1')
      }]
    : []
}
