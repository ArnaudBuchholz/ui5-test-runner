'use strict'

const { join, dirname, basename } = require('path')
const { body } = require('reserve')
const { extractPageUrl } = require('./tools')
const { Request, Response } = require('reserve')
const { getOutput } = require('./output')
const { begin, testStart, log, testDone, done } = require('./qunit-hooks')
const { addTestPages } = require('./add-test-pages')
const { getJobProgress } = require('./get-job-progress')
const { readFile } = require('fs/promises')
const { TextEncoder } = require('util')
const { resolveDependencyPath } = require('./npm.js')

const punyexprBinPath = join(resolveDependencyPath('punyexpr'), 'dist/punyexpr.js')
const punybindBinPath = join(resolveDependencyPath('punybind'), 'dist/punybind.js')

module.exports = job => {
  async function endpointImpl (api, implementation, request) {
    const url = extractPageUrl(request.headers)
    const data = await body(request)
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
        cwd: __dirname,
        file: 'inject/qunit-hooks.js',
        static: !job.debugDevMode
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
        cwd: dirname(job.progressPage),
        file: basename(job.progressPage),
        static: !job.debugDevMode
      }, {
      // Report 'main' substituted for progress
        match: '^/_/report/main.js',
        cwd: __dirname,
        file: 'defaults/report/progress.js',
        static: !job.debugDevMode
      }, {
      // Other report resources
        match: '^/_/report/(.*)',
        cwd: __dirname,
        file: 'defaults/report/$1',
        static: !job.debugDevMode
      }, {
      // punybind
        match: '^/_/punybind.js',
        cwd: dirname(punybindBinPath),
        file: basename(punybindBinPath),
        static: !job.debugDevMode
      }, {
      // punyexpr
        match: '^/_/punyexpr.js',
        cwd: dirname(punyexprBinPath),
        file: basename(punyexprBinPath),
        static: !job.debugDevMode
      }, {
      // Endpoint to retry on progress
        method: 'INFO',
        match: '^/_/progress',
        custom: (request, response) => {
          response.writeHead(204)
          response.end()
        }
      }, {
      // Endpoint to follow progress
        match: '^/_/progress(?:\\?page=([^&]*)(?:&test=([^&]*))?)?',
        custom: (request, response, pageId, testId) => getJobProgress(job, request, response, pageId, testId)
      }, {
      // Endpoint to coverage files
        match: '^/_/coverage/(.*)',
        cwd: job.coverageReportDir,
        file: '$1',
        static: false
      }, {
      // Endpoint to report
        match: '^/_/report.html',
        cwd: __dirname,
        file: 'report.html',
        static: !job.debugDevMode
      }, {
      // Endpoint to report files
        match: '^/_/(.*)',
        cwd: job.reportDir,
        file: '$1',
        static: false
      }]
    : []
}
