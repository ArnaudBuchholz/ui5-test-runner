jest.mock('child_process')
const { join } = require('path')
const { mock } = require('reserve')
const jobFactory = require('../../src/job')
const reserveConfigurationFactory = require('../../src/reserve')
const { _hook: hook } = require('child_process')
const executeTests = require('../../src/tests')

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
      if (!Object.keys(pages).every(page => {
        if (referer.endsWith(page)) {
          pages[page](referer).then(() => childProcess.emit('close'))
          return false
        }
        return true
      })) {
        return
      }
    }
    console.log('childProcess', childProcess.scriptPath, ...childProcess.args)
  }

  beforeAll(() => {
    log = jest.spyOn(console, 'log').mockImplementation()
    hook.on('new', onNewChildProcess)
  })

  let job
  let mocked

  async function setup (cwd, ...args) {
    job = jobFactory.fromCmdLine(cwd, [0, 0, ...args])
    const configuration = await reserveConfigurationFactory(job)
    mocked = await mock(configuration)
  }

  describe('simple test execution', () => {
    beforeAll(async () => {
      await setup('/test/project', `-tstReportDir:${join(__dirname, '../tmp/browser')}`)
      pages = {
        'testsuite.qunit.html': async referer => {
          const response = await mocked.request('GET', '/resources/sap/ui/qunit/qunit-redirect.js', { referer })
          expect(response.statusCode).toStrictEqual(200)
          expect(response.toString().includes('/_/addTestPages')).toStrictEqual(true)
          await mocked.request('POST', '/_/addTestPages', { referer }, JSON.stringify([
            '/page1.html',
            '/page2.html'
          ]))
        },
        'page1.html': async referer => {
          await mocked.request('POST', '/_/QUnit/begin', { referer }, JSON.stringify({
            totalTests: 1
          }))
          await mocked.request('POST', '/_/QUnit/testDone', { referer }, JSON.stringify({
            failed: 0,
            passed: 1
          }))
          await mocked.request('POST', '/_/QUnit/done', { referer }, JSON.stringify({
            failed: 0
          }))
        },
        'page2.html': async referer => {
          await mocked.request('POST', '/_/QUnit/begin', { referer }, JSON.stringify({
            totalTests: 1
          }))
          await mocked.request('POST', '/_/QUnit/testDone', { referer }, JSON.stringify({
            failed: 0,
            passed: 1
          }))
          await mocked.request('POST', '/_/QUnit/done', { referer }, JSON.stringify({
            failed: 0
          }))
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
  })
})
