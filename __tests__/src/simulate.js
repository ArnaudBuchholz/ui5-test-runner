jest.mock('child_process')
const { join } = require('path')
const { mock } = require('reserve')
const jobFactory = require('../../src/job')
const reserveConfigurationFactory = require('../../src/reserve')
const { _hook: hook } = require('child_process')
const executeTests = require('../../src/tests')
const nock = require('nock')

describe('simulate', () => {
  let log

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
        console.error(`Page ${referer} not found`)
      }
    }
    console.log('childProcess', childProcess.scriptPath, ...childProcess.args)
  }

  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation()
    hook.on('new', onNewChildProcess)
    const nockScope = nock('https://ui5.sap.com/1.87.0').persist()
    const nockContent = [
      '/resources/sap-ui-core.js',
      '/resources/sap/ui/qunit/qunit-redirect.js',
      '/resources/sap/ui/thirdparty/qunit.js',
      '/resources/sap/ui/thirdparty/qunit-2.js'
    ]
    nockContent.forEach(url => {
      nockScope.get(url).reply(200, `/* ${url} */`)
    })
  })

  let job
  let mocked

  async function setup (name, ...args) {
    job = jobFactory.fromCmdLine(`/simulate/${name}`, [0, 0,
      `-tstReportDir:${join(__dirname, `../tmp/simulate/${name}/report`)}`,
      `-covTempDir:${join(__dirname, `../tmp/simulate/${name}/coverage/temp`)}`,
      `-covReportDir:${join(__dirname, `../tmp/simulate/${name}/coverage/report`)}`,
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
      await setup('pageFilterParam', '-pageFilter:page(a|b)\\.', '-pageParams:d')
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

/*
  describe('error')
  describe('progress')
*/

  afterAll(() => {
    hook.off('new', onNewChildProcess)
    log.mockRestore()
  })
})
