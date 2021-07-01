jest.mock('child_process')
const { join } = require('path')
const { mock } = require('reserve')
const jobFactory = require('../../src/job')
const reserveConfigurationFactory = require('../../src/reserve')
const { _hook: hook } = require('child_process')
const executeTests = require('../../src/tests')
const nock = require('nock')
const { readFile, stat, writeFile } = require('fs').promises
const { cleanDir, createDir } = require('../../src/tools')

describe('simulate', () => {
  let log
  let error
  const simulatePath = join(__dirname, '../../tmp/simulate')

  let pages = {}

  function onNewChildProcess (childProcess) {
    if (childProcess.scriptPath.endsWith('nyc.js')) {
      childProcess.emit('close')
      return
    }
    if (childProcess.scriptPath.endsWith('chromium.js')) {
      const referer = childProcess.args[0]
      const pageFound = !Object.keys(pages).every(page => {
        if (referer.endsWith(page)) {
          pages[page](referer).then(() => childProcess.emit('close'))
          return false
        }
        return true
      })
      if (!pageFound) {
        console.warn(`Page ${referer} not found`)
        expect(false).toStrictEqual(true)
      }
      return
    }
    console.warn('childProcess', childProcess.scriptPath, ...childProcess.args)
  }

  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation()
    error = jest.spyOn(console, 'error').mockImplementation()
    hook.on('new', onNewChildProcess)
    const nockScope = nock('https://ui5.sap.com/').persist()
    const nockContent = [
      '/resources/sap-ui-core.js',
      '/resources/sap/ui/qunit/qunit-redirect.js',
      '/resources/sap/ui/thirdparty/qunit.js',
      '/resources/sap/ui/thirdparty/qunit-2.js'
    ]
    nockContent.forEach(url => {
      nockScope.get(url).reply(200, `/* ${url} */`)
    })
    nockScope.get('/resources/not-found.js').reply(404)
    nockScope.get('/resources/error.js').reply(500)
    return cleanDir(simulatePath)
  })

  let job
  let mocked

  async function setup (name, ...args) {
    job = jobFactory.fromCmdLine(join(simulatePath, 'name'), [0, 0,
      `-tstReportDir:${join(simulatePath, name, 'report')}`,
      `-covTempDir:${join(simulatePath, name, 'coverage/temp')}`,
      `-covReportDir:${join(simulatePath, name, 'coverage/report')}`,
      ...args
    ])
    const configuration = await reserveConfigurationFactory(job)
    mocked = await mock(configuration)
  }

  async function simulateOK (referer, totalTests = 1, __coverage__ = undefined) {
    await mocked.request('POST', '/_/QUnit/begin', { referer }, JSON.stringify({ totalTests }))
    await mocked.request('POST', '/_/QUnit/testDone', { referer }, JSON.stringify({ failed: 0, passed: totalTests }))
    await mocked.request('POST', '/_/QUnit/done', { referer }, JSON.stringify({ failed: 0, __coverage__ }))
  }

  describe('simple test execution', () => {
    beforeAll(async () => {
      await setup('simple')
      pages = {
        'testsuite.qunit.html': async referer => {
          const response = await mocked.request('GET', '/resources/sap/ui/qunit/qunit-redirect.js', { referer })
          expect(response.statusCode).toStrictEqual(200)
          expect(response.toString().includes('qunit-redirect.js */')).toStrictEqual(false)
          expect(response.toString().includes('/_/addTestPages')).toStrictEqual(true)
          await mocked.request('POST', '/_/addTestPages', { referer }, JSON.stringify([
            '/page1.html',
            '/page2.html'
          ]))
        },
        'page1.html': async referer => {
          const response = await mocked.request('GET', '/resources/sap/ui/thirdparty/qunit.js', { referer })
          expect(response.statusCode).toStrictEqual(200)
          expect(response.toString().includes('qunit.js */')).toStrictEqual(true)
          expect(response.toString().includes('QUnit/begin')).toStrictEqual(true)
          simulateOK(referer, 1, {})
        },
        'page2.html': async referer => {
          const response = await mocked.request('GET', '/resources/sap/ui/thirdparty/qunit-2.js', { referer })
          expect(response.statusCode).toStrictEqual(200)
          expect(response.toString().includes('qunit-2.js */')).toStrictEqual(true)
          expect(response.toString().includes('QUnit/begin')).toStrictEqual(true)
          simulateOK(referer)
        }
      }
      await executeTests(job)
    })

    it('succeeded', () => {
      expect(job.failed).toStrictEqual(0)
    })

    it('provides a progress endpoint', async () => {
      const response = await mocked.request('GET', '/_/progress')
      expect(response.statusCode).toStrictEqual(200)
      const progress = JSON.parse(response.toString())
      expect(Object.keys(progress.testPages).length).toStrictEqual(2)
      expect(progress.testPages['/page1.html']).not.toStrictEqual(undefined)
      expect(progress.testPages['/page1.html'].total).toStrictEqual(1)
      expect(progress.testPages['/page1.html'].failed).toStrictEqual(0)
      expect(progress.testPages['/page1.html'].passed).toStrictEqual(1)
      expect(progress.testPages['/page1.html'].report).not.toStrictEqual(undefined)
      expect(progress.testPages['/page2.html']).not.toStrictEqual(undefined)
    })

    it('generates a report', async () => {
      const reportPath = join(__dirname, '../../tmp/simulate/simple/report')
      // pages.json
      const pagesJson = JSON.parse((await readFile(join(reportPath, 'pages.json'))).toString())
      expect(Object.keys(pagesJson).length).toStrictEqual(2)
      expect(pagesJson['/page1.html']).toStrictEqual('_page1.html')
      expect(pagesJson['/page2.html']).toStrictEqual('_page2.html')
      // _page1.html.json
      const page1HtmlJson = JSON.parse((await readFile(join(reportPath, '_page1.html.json'))).toString())
      expect(page1HtmlJson.total).toStrictEqual(1)
      expect(page1HtmlJson.failed).toStrictEqual(0)
      expect(page1HtmlJson.passed).toStrictEqual(1)
      expect(Array.isArray(page1HtmlJson.tests)).toStrictEqual(true)
      // _page1.html/ output folder
      const page1Stat = await stat(join(reportPath, '_page1.html'))
      expect(page1Stat.isDirectory()).toStrictEqual(true)
      // report.html
      const reportHtmlStat = await stat(join(reportPath, 'report.html'))
      expect(reportHtmlStat.isFile()).toStrictEqual(true)
    })
  })

  describe('using parallel:0', () => {
    beforeAll(async () => {
      await setup('parallel_0', '-parallel:0')
      pages = {} // No page is run
      await executeTests(job)
    })

    it('succeeded', () => {
      expect(job.failed).toStrictEqual(undefined)
    })
  })

  describe('using parallel:-1', () => {
    beforeAll(async () => {
      await setup('parallel_-1', '-parallel:-1')
      pages = {
        'testsuite.qunit.html': async referer => {
          await mocked.request('POST', '/_/addTestPages', { referer }, JSON.stringify([
            '/page1.html'
          ]))
        }
      }
      await executeTests(job)
    })

    it('succeeded', () => {
      expect(job.failed).toStrictEqual(undefined)
    })
  })

  describe('using pageFilter & pageParams', () => {
    beforeAll(async () => {
      await setup('page_filter_and_param', '-pageFilter:page(a|b)\\.', '-pageParams:d')
      pages = {
        'testsuite.qunit.html': async referer => {
          await mocked.request('POST', '/_/addTestPages', { referer }, JSON.stringify([
            '/pagea.html',
            '/pageb.html?c',
            '/pagec.html'
          ]))
        },
        'pagea.html?d': async referer => {
          simulateOK(referer)
        },
        'pageb.html?c&d': async referer => {
          simulateOK(referer)
        }
      }
      await executeTests(job)
    })

    it('succeeded', () => {
      expect(job.failed).toStrictEqual(0)
    })
  })

  describe('error (test fail)', () => {
    beforeAll(async () => {
      await setup('error')
      pages = {
        'testsuite.qunit.html': async referer => {
          await mocked.request('POST', '/_/addTestPages', { referer }, JSON.stringify([
            '/page1.html',
            '/page2.html'
          ]))
        },
        'page1.html': async referer => {
          simulateOK(referer)
        },
        'page2.html': async referer => {
          await mocked.request('POST', '/_/QUnit/begin', { referer }, JSON.stringify({ totalTests: 1 }))
          await mocked.request('POST', '/_/QUnit/testDone', { referer }, JSON.stringify({ failed: 1, passed: 0 }))
          await mocked.request('POST', '/_/QUnit/done', { referer }, JSON.stringify({ failed: 1 }))
        }
      }
      await executeTests(job)
    })

    it('failed', () => {
      expect(job.failed).toStrictEqual(1)
    })
  })

  describe('error (invalid QUnit hooks)', () => {
    beforeAll(async () => {
      await setup('error')
      pages = {
        'testsuite.qunit.html': async referer => {
          await mocked.request('POST', '/_/addTestPages', { referer }, JSON.stringify([
            '/page1.html',
            '/page2.html'
          ]))
        },
        'page1.html': async referer => {
          simulateOK(referer)
        },
        'page2.html': async referer => {
          // The next call will dump an error because the missing /_/QUnit/begin call generates the page structure
          await mocked.request('POST', '/_/QUnit/testDone', { referer }, JSON.stringify({ failed: 1, passed: 0 }))
          await mocked.request('POST', '/_/QUnit/done', { referer }, JSON.stringify({ failed: 1 }))
        }
      }
      await executeTests(job)
    })

    it('failed', () => {
      expect(job.failed).toStrictEqual(1)
    })
  })

  describe('global timeout', () => {
    beforeAll(async () => {
      await setup('timeout', '-parallel:1', '-globalTimeout:10000')
      pages = {
        'testsuite.qunit.html': async referer => {
          await mocked.request('POST', '/_/addTestPages', { referer }, JSON.stringify([
            '/page1.html',
            '/page2.html'
          ]))
        },
        'page1.html': async referer => {
          job.globalTimeout = 1 // Update to ensure the code will globally time out *after* page1
          simulateOK(referer)
        },
        'page2.html': async referer => {
          expect(false).toStrictEqual(true) // Should not be executed
        }
      }
      await executeTests(job)
    })

    it('failed', () => {
      expect(job.failed).not.toStrictEqual(0)
    })
  })

  describe('coverage substitution and ui5 cache', () => {
    let ui5Cache

    beforeAll(async () => {
      await setup('coverage_and_cache', '-cache:ui5')
      ui5Cache = join(__dirname, '../../tmp/simulate/coverage_and_cache/ui5')
      await cleanDir(ui5Cache)
      pages = {
        'testsuite.qunit.html': async referer => {
          const instrumentedPath = join(__dirname, '../../tmp/simulate/coverage_and_cache/coverage/temp/instrumented')
          await createDir(instrumentedPath)
          const instrumentedComponentPath = join(instrumentedPath, 'component.js')
          await writeFile(instrumentedComponentPath, `/* component.js */
var global=new Function("return this")();
// code from component.js
`)
          const cachedResponses = await Promise.all([
            mocked.request('GET', '/resources/sap-ui-core.js', { referer }),
            mocked.request('GET', '/resources/sap-ui-core.js', { referer })
          ])
          expect(cachedResponses[0].statusCode).toStrictEqual(200)
          expect(cachedResponses[0].toString().includes('sap-ui-core.js */')).toStrictEqual(true)
          const notFoundResponse = await mocked.request('GET', '/resources/not-found.js', { referer })
          expect(notFoundResponse.statusCode).toStrictEqual(404)
          const errorResponse = await mocked.request('GET', '/resources/error.js', { referer })
          expect(errorResponse.statusCode).toStrictEqual(500)
          await mocked.request('POST', '/_/addTestPages', { referer }, JSON.stringify([
            '/page1.html',
            '/page2.html'
          ]))
        },
        'page1.html': async referer => {
          const coverageResponse = await mocked.request('GET', '/component.js', { referer })
          expect(coverageResponse.statusCode).toStrictEqual(200)
          expect(coverageResponse.toString().includes('component.js */')).toStrictEqual(true)
          expect(coverageResponse.toString().includes('var global=new Function("return this")();')).toStrictEqual(false)
          expect(coverageResponse.toString().includes('var global=window.top;')).toStrictEqual(true)
          const cachedResponse = await mocked.request('GET', '/resources/sap/ui/thirdparty/qunit.js', { referer })
          expect(cachedResponse.statusCode).toStrictEqual(200)
          expect(cachedResponse.toString().includes('qunit.js */')).toStrictEqual(true)
          expect(cachedResponse.toString().includes('QUnit/begin')).toStrictEqual(true)
          simulateOK(referer)
        },
        'page2.html': async referer => {
          const cachedResponse = await mocked.request('GET', '/resources/not-found.js', { referer })
          expect(cachedResponse.statusCode).toStrictEqual(404)
          simulateOK(referer)
        }
      }
      await executeTests(job)
    })

    it('succeeded', () => {
      expect(job.failed).toStrictEqual(0)
    })
  })

  describe('error and failFast (stop after first failure)', () => {
    beforeAll(async () => {
      await setup('fail_fast', '-parallel:1', '-failFast')
      pages = {
        'testsuite.qunit.html': async referer => {
          await mocked.request('POST', '/_/addTestPages', { referer }, JSON.stringify([
            '/page1.html',
            '/page2.html',
            '/page3.html',
            '/page4.html'
          ]))
        },
        'page1.html': async referer => {
          simulateOK(referer)
        },
        'page2.html': async referer => {
          await mocked.request('POST', '/_/QUnit/begin', { referer }, JSON.stringify({ totalTests: 1 }))
          await mocked.request('POST', '/_/QUnit/testDone', { referer }, JSON.stringify({ failed: 1, passed: 0 }))
          await mocked.request('POST', '/_/QUnit/done', { referer }, JSON.stringify({ failed: 1 }))
        }
        // Should not try to run page 3 & 4
      }
      await executeTests(job)
    })

    it('failed', () => {
      expect(job.failed).toStrictEqual(3) // page2 + other pages that didn't run
    })
  })

  describe('ui5 libraries', () => {
    beforeAll(async () => {
      await setup('ui5', '-ui5:https://any.cdn.com/', `-libs:inject/=${join(__dirname, '../../src/inject')}`)
      pages = {
        'testsuite.qunit.html': async referer => {
          await mocked.request('POST', '/_/addTestPages', { referer }, JSON.stringify([
            '/page1.html'
          ]))
        },
        'page1.html': async referer => {
          const response = await mocked.request('GET', '/resources/inject/qunit-hooks.js', { referer })
          expect(response.statusCode).toStrictEqual(200)
          expect(response.toString().includes('/* Injected QUnit hooks */')).toStrictEqual(true)
          simulateOK(referer)
        }
      }
      await executeTests(job)
    })

    it('succeeded', () => {
      expect(job.failed).toStrictEqual(0)
    })
  })

  afterAll(() => {
    hook.off('new', onNewChildProcess)
    log.mockRestore()
    error.mockRestore()
  })
})
