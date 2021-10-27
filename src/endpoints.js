'use strict'

const { join } = require('path')
const { body } = require('reserve')
const { screenshot, stop } = require('./browsers')
const { writeFile } = require('fs').promises
const { extractUrl, filename } = require('./tools')
const { Request, Response } = require('reserve')
const output = require('./output')

module.exports = job => {
  async function endpointImpl (implementation, request) {
    const url = extractUrl(request.headers)
    const data = JSON.parse(await body(request))
    if (job.parallel === -1) {
      output.endpoint(url, data)
    }
    try {
      await implementation.call(this, url, data)
    } catch (e) {
      output.endpointError(url, data, e)
    }
  }

  function synchronousEndpoint (implementation) {
    return async function (request, response) {
      await endpointImpl(implementation, request)
      response.writeHead(200)
      response.end()
    }
  }

  function endpoint (implementation) {
    return async function (request, response) {
      response.writeHead(200)
      response.end()
      await endpointImpl(implementation, request)
    }
  }

  function getPageTest (page, testId) {
    const { tests, order } = page
    if (!tests[testId]) {
      tests[testId] = {
        timestamps: []
      }
      order.push(testId)
    }
    return tests[testId]
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
          const page = {
            isOpa: details.isOpa,
            total: details.totalTests,
            failed: 0,
            passed: 0,
            tests: {},
            order: []
          }
          details.modules.forEach(module => {
            module.tests.forEach(test => getPageTest(page, test.testId))
          })
          job.testPages[url] = page
        })
      }, {
      // Endpoint to receive QUnit.testDone
        match: '^/_/QUnit/log',
        custom: synchronousEndpoint(async (url, report) => {
          const page = job.testPages[url]
          if (page.isOpa) {
            const { testId, runtime } = report
            getPageTest(page, testId).timestamps.push(runtime)
            await screenshot(job, url, `${testId}-${runtime}.png`)
          }
        })
      }, {
      // Endpoint to receive QUnit.testDone
        match: '^/_/QUnit/testDone',
        custom: synchronousEndpoint(async (url, report) => {
          const page = job.testPages[url]
          const { testId } = report
          if (report.failed) {
            await screenshot(job, url, `${testId}.png`)
            job.failed = true
            ++page.failed
          } else {
            ++page.passed
          }
          getPageTest(page, testId).report = report
        })
      }, {
      // Endpoint to receive QUnit.done
        match: '^/_/QUnit/done',
        custom: endpoint(async (url, report) => {
          const page = job.testPages[url]
          if (page) {
            await screenshot(job, url, 'screenshot.png')
            if (report.__coverage__) {
              const coverageFileName = join(job.covTempDir, `${filename(url)}.json`)
              await writeFile(coverageFileName, JSON.stringify(report.__coverage__))
              delete report.__coverage__
            }
            page.report = report
          }
          stop(job, url)
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
            if (((key === 'tests' || key === 'browsers') && typeof value === 'object') ||
                (key === 'order' && Array.isArray(value))
            ) {
              return undefined // Filter out
            }
            return value
          })
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
