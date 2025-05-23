const { mock: mockChildProcess } = require('child_process')
const { readFile, stat, writeFile } = require('fs').promises
const { mock } = require('reserve')
const nock = require('nock')
const { $browsers } = require('./symbols')
const { cleanDir, recreateDir } = require('./tools')
const { execute } = require('./tests')
const { getOutput } = require('./output')
const { join, dirname } = require('path')
const { probe: probeBrowser } = require('./browsers')
const { UTRError } = require('./error')

const jobFactory = require('./job')
const reserveConfigurationFactory = require('./reserve')

describe('simulate', () => {
  const simulatePath = join(__dirname, '../tmp/simulate')
  const cwd = join(__dirname, '../test/project')

  let job
  let mocked
  let pages = {}

  beforeAll(() => {
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

  async function get (url, referer) {
    return await mocked.request('GET', url, { 'x-page-url': referer })
  }

  async function post (url, referer, body) {
    const json = JSON.stringify(body)
    return await mocked.request('POST', url, {
      'x-page-url': referer,
      'content-type': 'application/json',
      'content-length': json.length
    }, json)
  }

  async function simulateOK (referer, __coverage__ = undefined) {
    await post('/_/QUnit/begin', referer, { totalTests: 1, modules: [{ tests: [{ testId: '1' }] }] })
    await post('/_/QUnit/testDone', referer, { testId: '1', failed: 0, passed: 1 })
    await post('/_/QUnit/done', referer, { failed: 0, __coverage__ })
  }

  async function setup (name, parameters) {
    mockChildProcess({
      api: 'fork',
      scriptPath: /puppeteer\.js$/,
      exec: async childProcess => {
        const config = JSON.parse((await readFile(childProcess.args[0])).toString())
        const { capabilities, url: referer } = config
        if (typeof capabilities === 'string') {
          await writeFile(capabilities, JSON.stringify({
            console: true,
            scripts: true
          }))
          childProcess.close()
        } else {
          childProcess.on('message.received', message => {
            if (message.command === 'stop') {
              childProcess.close()
            }
          })
          const pageName = Object.keys(pages).filter(page => referer.endsWith(page))[0]
          if (pageName) {
            await pages[pageName](referer)
          } else {
            console.warn(`Page ${referer} not found`)
            expect(false).toStrictEqual(true)
          }
        }
      },
      close: false
    })

    mockChildProcess({
      api: 'fork',
      scriptPath: /\breport\.js$/,
      exec: async childProcess => {
        const reportDir = childProcess.args[0]
        await writeFile(join(reportDir, 'report.html'), '<html />')
      }
    })

    job = jobFactory.fromObject(cwd, {
      reportDir: join(simulatePath, name, 'report'),
      coverageTempDir: join(simulatePath, name, 'coverage/temp'),
      coverageReportDir: join(simulatePath, name, 'coverage/report'),
      coverage: false,
      ...parameters
    })
    const configuration = await reserveConfigurationFactory(job)
    mocked = mock(configuration)
    await new Promise(resolve => {
      mocked.on('ready', () => resolve())
    })
  }

  async function safeExecute () {
    try {
      await recreateDir(job.reportDir)
      await probeBrowser(job)
      getOutput(job).reportOnJobProgress()
      await execute(job)
    } catch (e) {
      if (e instanceof UTRError && e.code === UTRError.BROWSER_FAILED_CODE) {
        const exception = Object.keys(job[$browsers])
          .map(url => job[$browsers][url].childProcess && job[$browsers][url].childProcess.exception)
          .filter(e => !!e)[0]
        throw exception
      }
      throw e
    }
  }

  describe('mappings', () => {
    beforeAll(async () => {
      await setup('mappings', {
        mappings: [
          '/overridden/resources/(.*)=file(./LICENSE)'
        ]
      })
    })

    const urls = [
      '/webapp/resources/sap-ui-core.js',
      '/resources/sap-ui-core.js',
      '/custom/resources/sap-ui-core.js'
    ]
    urls.forEach(url => {
      it(`fetches UI5 resources whichever path is used (${url})`, async () => {
        const response = await get(url, 'test.html')
        expect(response.statusCode).toStrictEqual(200)
        expect(response.toString().includes('/sap-ui-core.js */')).toStrictEqual(true)
      })
    })

    it('enables overridding through mappings', async () => {
      const response = await get('/overridden/resources/sap-ui-core.js', 'test.html')
      expect(response.statusCode).toStrictEqual(200)
      expect(response.toString().startsWith('MIT License')).toStrictEqual(true)
    })
  })

  describe('legacy (local project)', () => {
    describe('simple test execution', () => {
      beforeAll(async () => {
        await setup('simple')
        pages = {
          'testsuite.qunit.html': async referer => {
            const response = await get('/resources/sap/ui/qunit/qunit-redirect.js', referer)
            expect(response.statusCode).toStrictEqual(200)
            expect(response.toString().includes('qunit-redirect.js */')).toStrictEqual(false)
            expect(response.toString().includes('addTestPages')).toStrictEqual(true)
            await post('/_/addTestPages', referer, {
              type: 'suite',
              pages: [
                referer.replace('testsuite.qunit.html', 'page1.html'),
                referer.replace('testsuite.qunit.html', 'page2.html')
              ]
            })
          },
          'page1.html': async referer => {
            const response = await get('/resources/sap/ui/thirdparty/qunit.js', referer)
            expect(response.statusCode).toStrictEqual(200)
            expect(response.toString().includes('qunit.js */')).toStrictEqual(true)
            expect(response.toString().includes('QUnit/begin')).toStrictEqual(true)
            simulateOK(referer)
          },
          'page2.html': async referer => {
            const response = await get('/resources/sap/ui/thirdparty/qunit-2.js', referer)
            expect(response.statusCode).toStrictEqual(200)
            expect(response.toString().includes('qunit-2.js */')).toStrictEqual(true)
            expect(response.toString().includes('QUnit/begin')).toStrictEqual(true)
            simulateOK(referer)
          }
        }
        await safeExecute()
      })

      it('succeeded', () => {
        expect(job.failed).toStrictEqual(false)
      })

      it('provides a progress endpoint', async () => {
        const response = await mocked.request('GET', '/_/progress')
        expect(response.statusCode).toStrictEqual(200)
        const progress = JSON.parse(response.toString())
        expect(Object.keys(progress.qunitPages).length).toStrictEqual(2)

        const page1 = Object.keys(progress.qunitPages).filter(url => url.endsWith('page1.html'))
        expect(page1).not.toBeUndefined()
        const qunitPage1 = progress.qunitPages[page1]
        expect(qunitPage1).not.toStrictEqual(undefined)
        expect(qunitPage1.failed).toStrictEqual(0)
        expect(qunitPage1.passed).toStrictEqual(1)
        expect(qunitPage1.report).not.toStrictEqual(undefined)

        const page2 = Object.keys(progress.qunitPages).filter(url => url.endsWith('page2.html'))
        expect(page2).not.toBeUndefined()
        const qunitPage2 = progress.qunitPages[page2]
        expect(qunitPage2).not.toStrictEqual(undefined)
      })

      it('generates a report', async () => {
        const info = await stat(join(job.reportDir, 'report.html'))
        expect(info.isFile()).toStrictEqual(true)
        expect(info.size).toBeGreaterThan(0)
      })
    })

    describe('simple test execution (loose qunit)', () => {
      beforeAll(async () => {
        await setup('simple-early')
        pages = {
          'testsuite.qunit.html': async referer => {
            await post('/_/addTestPages', referer, {
              type: 'suite',
              pages: [
                referer.replace('testsuite.qunit.html', 'page1.html')
              ]
            })
          },
          'page1.html': async referer => {
            await post('/_/QUnit/begin', referer, { totalTests: 0, modules: [] })
            await post('/_/QUnit/done', referer, { failed: 0 })
            await post('/_/QUnit/testStart', referer, { module: 'module', name: 'test', testId: '1', modules: [{ name: 'M1', tests: [{ testId: '1' }] }] })
            await post('/_/QUnit/testDone', referer, { testId: '1', failed: 0, passed: 1 })
            await post('/_/QUnit/done', referer, { failed: 0 })
          }
        }
        await safeExecute()
      })

      it('succeeded', () => {
        expect(job.failed).toStrictEqual(false)
      })
    })

    describe('error', () => {
      describe('one test fail', () => {
        beforeAll(async () => {
          await setup('error1')
          pages = {
            'testsuite.qunit.html': async referer => {
              await post('/_/addTestPages', referer, {
                type: 'suite',
                pages: [
                  '/page1.html',
                  '/page2.html'
                ]
              })
            },
            'page1.html': referer => simulateOK(referer),
            'page2.html': async referer => {
              await post('/_/QUnit/begin', referer, { totalTests: 1, modules: [{ tests: [{ testId: '1' }] }] })
              await post('/_/QUnit/testDone', referer, { testId: '1', failed: 1, passed: 0 })
              await post('/_/QUnit/done', referer, { failed: 1 })
            }
          }
          await safeExecute()
        })

        it('failed', () => {
          expect(job.failed).toStrictEqual(true)
        })
      })

      describe('several tests fail', () => {
        beforeAll(async () => {
          await setup('errorN')
          pages = {
            'testsuite.qunit.html': async referer => {
              await post('/_/addTestPages', referer, {
                type: 'suite',
                pages: [
                  '/page1.html',
                  '/page2.html',
                  '/page3.html'
                ]
              })
            },
            'page1.html': referer => simulateOK(referer),
            'page2.html': async referer => {
              await post('/_/QUnit/begin', referer, { totalTests: 1, modules: [{ tests: [{ testId: '1' }] }] })
              await post('/_/QUnit/testDone', referer, { testId: '1', failed: 1, passed: 0 })
              await post('/_/QUnit/done', referer, { failed: 1 })
            },
            'page3.html': async referer => {
              await post('/_/QUnit/begin', referer, { totalTests: 2, modules: [{ tests: [{ testId: '2' }, { testId: '3' }] }] })
              await post('/_/QUnit/testDone', referer, { testId: '2', failed: 2, passed: 0 })
              await post('/_/QUnit/testDone', referer, { testId: '3', failed: 1, passed: 0 })
              await post('/_/QUnit/done', referer, { failed: 3 })
            }
          }
          await safeExecute()
        })

        it('failed', () => {
          expect(job.failed).toStrictEqual(true)
        })
      })

      describe('invalid QUnit hooks', () => {
        beforeAll(async () => {
          await setup('errorQunit')
          pages = {
            'testsuite.qunit.html': async referer => {
              await post('/_/addTestPages', referer, {
                type: 'suite',
                pages: [
                  '/page1.html',
                  '/page2.html'
                ]
              })
            },
            'page1.html': async referer => {
              simulateOK(referer)
            },
            'page2.html': async referer => {
              // The next call will dump an error because the missing /_/QUnit/begin call generates the page structure
              await post('/_/QUnit/testDone', referer, { failed: 1, passed: 0 })
              await post('/_/QUnit/done', referer, { failed: 1 })
            }
          }
          await safeExecute()
        })

        it('failed', () => {
          expect(job.failed).toStrictEqual(true)
        })
      })
    })

    describe('global timeout', () => {
      beforeAll(async () => {
        await setup('global-timeout', {
          parallel: 1,
          globalTimeout: 10000
        })
        pages = {
          'testsuite.qunit.html': async referer => {
            await post('/_/addTestPages', referer, {
              type: 'suite',
              pages: [
                '/page1.html',
                '/page2.html'
              ]
            })
          },
          'page1.html': async headers => {
            job.globalTimeout = 1 // Update to ensure the code will globally time out *after* page1
            simulateOK(headers)
          },
          'page2.html': async headers => {
            expect(false).toStrictEqual(true) // Should not be executed
          }
        }
        await safeExecute()
      })

      it('failed', () => {
        expect(job.failed).toStrictEqual(true)
        expect(job.timedOut).toStrictEqual(true)
      })
    })

    describe('page timeout', () => {
      beforeAll(async () => {
        await setup('page-timeout', {
          parallel: 1,
          pageTimeout: 250
        })
        pages = {
          'testsuite.qunit.html': async referer => {
            await post('/_/addTestPages', referer, {
              type: 'suite',
              pages: [
                '/page1.html'
              ]
            })
          },
          'page1.html': async headers => {
            await post('/_/QUnit/begin', headers, {
              totalTests: 3,
              modules: [{
                name: '0',
                tests: [{
                  name: '1',
                  testId: '1'
                }, {
                  name: '2',
                  testId: '2'
                }, {
                  name: '3',
                  testId: '3'
                }]
              }]
            })
            await post('/_/QUnit/testStart', headers, { module: '0', name: '1', testId: '1' })
            await post('/_/QUnit/testDone', headers, { testId: '1', failed: 0, passed: 1 })
            await post('/_/QUnit/testStart', headers, { module: '0', name: '2', testId: '2' })
          }
        }
        await safeExecute()
      })

      it('failed', () => {
        expect(job.failed).toStrictEqual(true)
        expect(job.timedOut).toStrictEqual(true)
        const page = job.qunitPages['http://localhost:0/page1.html']
        expect(page.failed).toStrictEqual(2)
        expect(page.end).not.toBeUndefined()
        expect(page.timedOut).toStrictEqual(true)
        const { tests } = page.modules[0]
        expect(tests[1].report.failed).toStrictEqual(1)
        expect(tests[1].report.passed).toStrictEqual(0)
        expect(tests[1].end).not.toBeUndefined()
        expect(tests[2].report.failed).toStrictEqual(1)
        expect(tests[2].report.passed).toStrictEqual(0)
        expect(tests[2].start).toBeUndefined()
        expect(tests[2].end).toBeUndefined()
      })
    })

    describe('coverage substitution and ui5 cache', () => {
      let ui5Cache

      beforeAll(async () => {
        ui5Cache = join(__dirname, '../tmp/simulate/coverage_and_cache/ui5')
        await cleanDir(ui5Cache)
        await setup('coverage_and_cache', {
          cache: ui5Cache,
          coverage: true,
          browserRetry: 0
        })
        pages = {
          'testsuite.qunit.html': async referer => {
            const cachedResponses = await Promise.all([
              get('/resources/sap-ui-core.js', referer),
              get('/resources/sap-ui-core.js', referer)
            ])
            expect(cachedResponses[0].statusCode).toStrictEqual(200)
            expect(cachedResponses[0].toString().includes('sap-ui-core.js */')).toStrictEqual(true)
            const notFoundResponse = await get('/resources/not-found.js', referer)
            expect(notFoundResponse.statusCode).toStrictEqual(404)
            const errorResponse = await get('/resources/error.js', referer)
            expect(errorResponse.statusCode).toStrictEqual(500)
            await post('/_/addTestPages', referer, {
              type: 'suite',
              pages: [
                '/page1.html',
                '/page2.html'
              ]
            })
          },
          'page1.html': async referer => {
            const coverageResponse = await get('/component.js', referer)
            expect(coverageResponse.statusCode).toStrictEqual(200)
            expect(coverageResponse.toString().includes('UIComponent.extend(\'app.Component\'')).toStrictEqual(true)
            expect(coverageResponse.toString().includes('var global=new Function("return this")();')).toStrictEqual(false)
            expect(coverageResponse.toString().includes('var global=window.top;')).toStrictEqual(true)
            const cachedResponse = await get('/resources/sap/ui/thirdparty/qunit.js', referer)
            expect(cachedResponse.statusCode).toStrictEqual(200)
            expect(cachedResponse.toString().includes('qunit.js */')).toStrictEqual(true)
            expect(cachedResponse.toString().includes('QUnit/begin')).toStrictEqual(true)
            simulateOK(referer, {})
          },
          'page2.html': async referer => {
            const cachedResponse = await get('/resources/not-found.js', referer)
            expect(cachedResponse.statusCode).toStrictEqual(404)
            simulateOK(referer, {})
          }
        }
        await safeExecute()
      })

      it('succeeded', () => {
        expect(job.failed).toStrictEqual(false)
      })
    })

    describe('error and failFast (stop after first failure)', () => {
      beforeAll(async () => {
        await setup('fail_fast', {
          parallel: 1,
          failFast: null
        })
        pages = {
          'testsuite.qunit.html': async headers => {
            await post('/_/addTestPages', headers, {
              type: 'suite',
              pages: [
                '/page1.html',
                '/page2.html',
                '/page3.html',
                '/page4.html'
              ]
            })
          },
          'page1.html': async referer => {
            simulateOK(referer)
          },
          'page2.html': async referer => {
            await post('/_/QUnit/begin', referer, { totalTests: 1 })
            await post('/_/QUnit/testDone', referer, { failed: 1, passed: 0 })
            await post('/_/QUnit/done', referer, { failed: 1 })
          }
          // Should not try to run page 3 & 4
        }
        await safeExecute()
      })

      it('failed', () => {
        expect(job.failed).toStrictEqual(true)
      })
    })

    describe('error when no page found', () => {
      beforeAll(async () => {
        await setup('no_page', {
          parallel: 1
        })
        pages = {
          'testsuite.qunit.html': async referer => {
            await post('/_/addTestPages', referer, { type: 'none' })
          }
        }
        await safeExecute()
      })

      it('failed', () => {
        expect(job.failed).toStrictEqual(true)
      })
    })

    describe('ui5 libraries', () => {
      beforeAll(async () => {
        await setup('libs', {
          ui5: 'https://any.cdn.com/',
          libs: [dirname(__dirname), `inject/=${join(__dirname, 'inject')}`]
        })
        pages = {
          'testsuite.qunit.html': async referer => {
            await post('/_/addTestPages', referer, {
              type: 'suite',
              pages: [
                '/page1.html'
              ]
            })
          },
          'page1.html': async referer => {
            const response1 = await get('/resources/inject/qunit-hooks.js', referer)
            expect(response1.statusCode).toStrictEqual(200)
            expect(response1.toString().includes('/* Injected QUnit hooks */')).toStrictEqual(true)
            const response2 = await get('/resources/src/inject/qunit-hooks.js', referer)
            expect(response2.statusCode).toStrictEqual(200)
            expect(response2.toString().includes('/* Injected QUnit hooks */')).toStrictEqual(true)
            simulateOK(referer)
          }
        }
        await safeExecute()
      })

      it('succeeded', () => {
        expect(job.failed).toStrictEqual(false)
      })
    })
  })
})
