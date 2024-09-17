jest.mock('./browsers.js', () => ({
  screenshot: jest.fn(),
  stop: jest.fn()
}))
const { screenshot, stop } = require('./browsers')

jest.mock('./coverage.js', () => ({
  collect: jest.fn()
}))
const { collect } = require('./coverage')

const mockGenericError = jest.fn()

jest.mock('./output.js', () => ({
  getOutput: () => ({
    genericError: mockGenericError,
    debug: jest.fn()
  })
}))

const {
  get,
  begin,
  testStart,
  log,
  testDone,
  done
} = require('./qunit-hooks.js')
const { UTRError } = require('./error')

describe('src/qunit-hooks', () => {
  const url = 'http://localhost:80/page1.html'
  let job

  beforeEach(() => {
    screenshot.mockReset()
    screenshot.mockImplementation((job, url, testId) => Promise.resolve(`whatever/${testId}.png`))
    stop.mockClear()
    collect.mockClear()
    mockGenericError.mockClear()
    job = {
      screenshot: true,
      browserCapabilities: {
        screenshot: false
      }
    }
  })

  const getModules = () => [{
    name: 'module 1',
    tests: [{
      name: 'test 1a',
      testId: '1a'
    }, {
      name: 'test 1b',
      testId: '1b'
    }]
  }, {
    name: 'module 2',
    tests: [{
      name: 'test 2c',
      testId: '2c'
    }, {
      name: 'test 2d',
      testId: '2d'
    }]
  }]

  const getBeginInfo = () => ({
    totalTests: 4,
    modules: getModules()
  })

  describe('begin', () => {
    it('allocates a placeholder page', async () => {
      await begin(job, url, getBeginInfo())
      const { page } = get(job, url)
      expect(page).not.toBeUndefined()
    })

    it('allocates an id for the page', async () => {
      await begin(job, url, getBeginInfo())
      const { page } = get(job, url)
      expect(page.id).not.toBeUndefined()
    })

    it('stores test information and keeps track of when it starts', async () => {
      await begin(job, url, getBeginInfo())
      const { page } = get(job, url)
      const { start, id, ...pageWithoutVariableInfos } = page
      expect(pageWithoutVariableInfos).toStrictEqual({
        isOpa: false,
        failed: 0,
        passed: 0,
        count: 4,
        modules: getModules()
      })
      expect(start).toBeInstanceOf(Date)
      expect(id).not.toBeUndefined()
    })

    it('resets the existing structure on retry', async () => {
      job.qunitPages = {
        [url]: {
          isOpa: true,
          failed: 2,
          passed: 1,
          count: 4,
          modules: [{
            name: 'module 1',
            tests: [{
              name: 'test 1a',
              testId: '1a',
              logs: []
            }, {
              name: 'test 1b',
              testId: '1b',
              anything: true
            }]
          }, {
            name: 'module 2',
            tests: [{
              name: 'test 2c',
              testId: '2c',
              failed: 1
            }, {
              name: 'test 2d',
              testId: '2d',
              whatever: {
              }
            }]
          }],
          start: 'Not a date',
          end: 'Not a date'
        }
      }
      await begin(job, url, {
        isOpa: true,
        ...getBeginInfo()
      })
      const { page } = get(job, url)
      const { start, id, ...pageWithoutVariableInfos } = page
      expect(pageWithoutVariableInfos).toStrictEqual({
        isOpa: true,
        failed: 0,
        passed: 0,
        count: 4,
        modules: getModules()
      })
      expect(start).toBeInstanceOf(Date)
      expect(id).not.toBeUndefined()
    })

    describe('ignoring hash variation', () => {
      it('starts empty, receives #any_hash', async () => {
        await begin(job, url, getBeginInfo())
        const { page } = get(job, url + '#any_hash')
        expect(page).not.toBeUndefined()
      })

      it('starts with #any_hash, receives #any_hash', async () => {
        await begin(job, url, getBeginInfo())
        const { page } = get(job, url + '#any_hash')
        expect(page).not.toBeUndefined()
      })

      it('starts with #any_hash, receives #another_hash', async () => {
        await begin(job, url, getBeginInfo())
        const { page } = get(job, url + '#another_hash')
        expect(page).not.toBeUndefined()
      })

      it('starts with #any_hash, receives empty', async () => {
        await begin(job, url, getBeginInfo())
        const { page } = get(job, url)
        expect(page).not.toBeUndefined()
      })
    })
  })

  describe('testStart', () => {
    beforeEach(async () => {
      await begin(job, url, {
        isOpa: false,
        ...getBeginInfo()
      })
    })

    it('signals test start', async () => {
      await testStart(job, url, {
        module: 'module 1',
        name: 'test 1a',
        testId: '1a'
      })

      const { test } = get(job, url, { testId: '1a' })
      expect(test.start).toBeInstanceOf(Date)
    })
  })

  describe('log', () => {
    const getLogFor1a = () => ({
      module: 'module 1',
      name: 'test 1a',
      result: true,
      message: 'message',
      actual: true,
      expected: true,
      testId: '1a',
      runtime: 1419
    })

    it('keeps track of logs', async () => {
      await begin(job, url, {
        isOpa: false,
        ...getBeginInfo()
      })
      await log(job, url, getLogFor1a())
      const { test } = get(job, url, { testId: '1a' })
      expect(test.logs).toBeInstanceOf(Array)
      expect(test.logs.length).toStrictEqual(1)
      expect(test.logs[0]).toStrictEqual({
        result: true,
        actual: true,
        expected: true,
        message: 'message',
        runtime: 1419
      })
    })

    it('keeps track of logs (multiple)', async () => {
      await begin(job, url, {
        isOpa: false,
        ...getBeginInfo()
      })
      await log(job, url, getLogFor1a())
      await log(job, url, {
        ...getLogFor1a(),
        result: false,
        message: 'an error occurred',
        actual: undefined,
        expected: {},
        runtime: 1506
      })
      const { test } = get(job, url, { testId: '1a' })
      expect(test.logs.length).toStrictEqual(2)
      expect(test.logs).toStrictEqual([{
        result: true,
        actual: true,
        expected: true,
        message: 'message',
        runtime: 1419
      }, {
        result: false,
        actual: undefined,
        expected: {},
        message: 'an error occurred',
        runtime: 1506
      }])
    })

    it('does not take a screenshot if not OPA', async () => {
      job.browserCapabilities.screenshot = '.png'
      await begin(job, url, {
        isOpa: false,
        ...getBeginInfo()
      })
      await log(job, url, getLogFor1a())
      expect(screenshot).not.toHaveBeenCalled()
    })

    it('does not take a screenshot if not available', async () => {
      await begin(job, url, {
        isOpa: true,
        ...getBeginInfo()
      })
      await log(job, url, getLogFor1a())
      expect(screenshot).not.toHaveBeenCalled()
    })

    it('does not take a screenshot if not disabled', async () => {
      job.browserCapabilities.screenshot = '.png'
      job.screenshot = false
      await begin(job, url, {
        isOpa: true,
        ...getBeginInfo()
      })
      await log(job, url, getLogFor1a())
      expect(screenshot).not.toHaveBeenCalled()
    })

    it('takes a screenshot for OPA tests', async () => {
      job.browserCapabilities.screenshot = '.png'
      await begin(job, url, {
        isOpa: true,
        ...getBeginInfo()
      })
      screenshot.mockImplementation(() => '1a-1419.png')
      await log(job, url, getLogFor1a())
      expect(screenshot).toHaveBeenCalledWith(job, url, '1a-1419')
      const { test } = get(job, url, { testId: '1a' })
      expect(test.logs[0]).toStrictEqual({
        result: true,
        actual: true,
        expected: true,
        message: 'message',
        runtime: 1419,
        screenshot: '1a-1419.png'
      })
    })

    it('takes a screenshot for OPA tests (hash changing)', async () => {
      job.browserCapabilities.screenshot = '.png'
      await begin(job, url, {
        isOpa: true,
        ...getBeginInfo()
      })
      await log(job, url + '#any_hash', getLogFor1a())
      expect(screenshot).toHaveBeenCalledWith(job, url, '1a-1419')
    })

    it('does not fail if screenshot failed', async () => {
      job.browserCapabilities.screenshot = '.png'
      await begin(job, url, {
        isOpa: true,
        ...getBeginInfo()
      })
      screenshot.mockImplementation(() => Promise.reject(new Error()))
      await log(job, url, getLogFor1a())
      expect(mockGenericError).toHaveBeenCalled()
      expect(job.failed).not.toStrictEqual(true)
      const { page, test } = get(job, url, { testId: '1a' })
      expect(page).toMatchObject({
        isOpa: true,
        failed: 0,
        passed: 0
      })
      expect(test.logs[0]).toStrictEqual({
        result: true,
        actual: true,
        expected: true,
        message: 'message',
        runtime: 1419
      })
    })

    it('fails on invalid test', async () => {
      await begin(job, url, {
        isOpa: true,
        ...getBeginInfo()
      })
      await expect(log(job, url, {
        module: 'module 1',
        name: 'unknown',
        result: true,
        message: 'message',
        actual: true,
        expected: true,
        testId: 'unk',
        runtime: 1000
      })).rejects.toThrow(UTRError.QUNIT_ERROR('No QUnit unit test found with id unk'))
      expect(stop).toHaveBeenCalledWith(job, url)
      expect(job.failed).toStrictEqual(true)
    })
  })

  describe('testDone', () => {
    const getTestDoneFor1a = () => ({
      name: 'test 1a',
      module: 'module 1',
      skipped: false,
      failed: 0,
      passed: 1,
      total: 1,
      runtime: 1515,
      assertions: [{
        result: true,
        message: 'message'
      }],
      testId: '1a',
      duration: 1515
    })

    beforeEach(async () => {
      await begin(job, url, {
        isOpa: false,
        ...getBeginInfo()
      })
    })

    describe('test success (no screenshot, page.passed += 1)', () => {
      afterEach(() => {
        expect(screenshot).not.toHaveBeenCalled()
        const { page, test } = get(job, url, { testId: '1a' })
        expect(page).toMatchObject({
          isOpa: false,
          failed: 0,
          passed: 1
        })
        expect(test).toMatchObject({
          report: {
            skipped: false,
            failed: 0,
            runtime: 1515,
            duration: 1515
          }
        })
        expect(test.end).toBeInstanceOf(Date)
      })

      it('store reports', async () => {
        await testDone(job, url, getTestDoneFor1a())
        const { test } = get(job, url, { testId: '1a' })
        expect(test).toMatchObject({
          report: {
            passed: 1,
            total: 1
          }
        })
      })

      it('supports more than one assertion in the test', async () => {
        await testDone(job, url, {
          ...getTestDoneFor1a(),
          passed: 2,
          total: 2
        })
        const { test } = get(job, url, { testId: '1a' })
        expect(test).toMatchObject({
          report: {
            passed: 2,
            total: 2
          }
        })
      })
    })

    describe('test failure (page.failed += 1)', () => {
      afterEach(() => {
        const { page, test } = get(job, url, { testId: '1a' })
        expect(page).toMatchObject({
          isOpa: false,
          failed: 1,
          passed: 0
        })
        expect(test).toMatchObject({
          report: {
            skipped: false,
            runtime: 1515,
            duration: 1515
          }
        })
        expect(test.end).toBeInstanceOf(Date)
        expect(job.failed).toStrictEqual(true)
      })

      describe('screenshot not supported', () => {
        it('increases failed count only', async () => {
          await testDone(job, url, {
            ...getTestDoneFor1a(),
            passed: 0,
            failed: 1,
            total: 1
          })
          expect(screenshot).not.toHaveBeenCalled()
          const { test } = get(job, url, { testId: '1a' })
          expect(test).toMatchObject({
            report: {
              passed: 0,
              failed: 1,
              total: 1
            }
          })
        })

        it('supports more than one failed assertion in the test', async () => {
          await testDone(job, url, {
            ...getTestDoneFor1a(),
            passed: 0,
            failed: 2,
            total: 2
          })
          const { test } = get(job, url, { testId: '1a' })
          expect(test).toMatchObject({
            report: {
              passed: 0,
              failed: 2,
              total: 2
            }
          })
        })

        it('supports failed and succeeded assertions in the test', async () => {
          await testDone(job, url, {
            ...getTestDoneFor1a(),
            passed: 1,
            failed: 1,
            total: 2
          })
          const { test } = get(job, url, { testId: '1a' })
          expect(test).toMatchObject({
            report: {
              passed: 1,
              failed: 1,
              total: 2
            }
          })
        })
      })

      describe('screenshot supported', () => {
        beforeEach(() => {
          job.browserCapabilities.screenshot = '.png'
        })

        it('takes a screenshot', async () => {
          await testDone(job, url, {
            ...getTestDoneFor1a(),
            passed: 0,
            failed: 1,
            total: 1
          })
          expect(screenshot).toHaveBeenCalledWith(job, url, '1a')
        })

        it('takes a screenshot (even if disabled)', async () => {
          job.screenshot = false
          await testDone(job, url, {
            ...getTestDoneFor1a(),
            passed: 0,
            failed: 1,
            total: 1
          })
          expect(screenshot).toHaveBeenCalledWith(job, url, '1a')
          const { test } = get(job, url, { testId: '1a' })
          expect(test.screenshot).toStrictEqual('1a.png')
        })

        it('takes a screenshot (hash changing)', async () => {
          await testDone(job, url + '#any_hash', {
            ...getTestDoneFor1a(),
            passed: 0,
            failed: 1,
            total: 1
          })
          expect(screenshot).toHaveBeenCalledWith(job, url, '1a')
        })

        it('does not stop if screenshot failed', async () => {
          screenshot.mockImplementation(() => Promise.reject(new Error()))
          await testDone(job, url, {
            ...getTestDoneFor1a(),
            passed: 0,
            failed: 1,
            total: 1
          })
          expect(mockGenericError).toHaveBeenCalled()
          expect(stop).not.toHaveBeenCalled()
        })
      })
    })

    it('fails if tests not started', async () => {
      delete job.qunitPages
      await expect(testDone(job, url, getTestDoneFor1a()))
        .rejects.toThrow(UTRError.QUNIT_ERROR('No QUnit page found for http://localhost:80/page1.html'))
      expect(stop).toHaveBeenCalledWith(job, url)
      expect(job.failed).toStrictEqual(true)
    })

    it('fails if URL does not exist', async () => {
      job.qunitPages = {}
      await expect(testDone(job, url, getTestDoneFor1a()))
        .rejects.toThrow(UTRError.QUNIT_ERROR('No QUnit page found for http://localhost:80/page1.html'))
      expect(stop).toHaveBeenCalledWith(job, url)
      expect(job.failed).toStrictEqual(true)
    })

    it('fails on invalid test id', async () => {
      await expect(testDone(job, url, {
        ...getTestDoneFor1a(),
        testId: '1c'
      }))
        .rejects.toThrow(UTRError.QUNIT_ERROR('No QUnit unit test found with id 1c'))
      expect(stop).toHaveBeenCalledWith(job, url)
      expect(job.failed).toStrictEqual(true)
    })

    it('fails on invalid test id', async () => {
      await expect(testDone(job, url, {
        ...getTestDoneFor1a(),
        testId: '1c'
      }))
        .rejects.toThrow(UTRError.QUNIT_ERROR('No QUnit unit test found with id 1c'))
      expect(stop).toHaveBeenCalledWith(job, url)
      expect(job.failed).toStrictEqual(true)
    })

    describe('fail OPA fast behavior', () => {
      beforeEach(async () => {
        job.failOpaFast = true
        await testDone(job, url, {
          ...getTestDoneFor1a(),
          passed: 0,
          failed: 1,
          total: 1
        })
      })

      it('fails the test immediately', () => {
        const { test } = get(job, url, { testId: '1a' })
        expect(test).toMatchObject({
          report: {
            passed: 0,
            failed: 1,
            total: 1
          }
        })
      })

      it('flags the remaining tests as skipped', () => {
        const { page } = get(job, url)
        page.modules.forEach(module => {
          module.tests.forEach(test => {
            if (test.testId !== '1a') {
              expect(test.skip).toStrictEqual(true)
            }
          })
        })
      })

      it('stops the page immediately', () => {
        expect(stop).toHaveBeenCalledWith(job, url)
      })
    })
  })

  describe('done', () => {
    const getDoneInfo = () => ({
      failed: 0,
      passed: 4,
      total: 4,
      runtime: 2853
    })

    beforeEach(async () => {
      await begin(job, url, {
        isOpa: false,
        ...getBeginInfo()
      })
    })

    it('stops the browser', async () => {
      await done(job, url, getDoneInfo())
      expect(stop).toHaveBeenCalledWith(job, url)
    })

    it('takes a screenshot if enabled', async () => {
      job.browserCapabilities.screenshot = '.png'
      await done(job, url, getDoneInfo())
      expect(screenshot).toHaveBeenCalledWith(job, url, 'done')
    })

    it('takes a screenshot if enabled (hash changing)', async () => {
      job.browserCapabilities.screenshot = '.png'
      await done(job, url + '#any_hash', getDoneInfo())
      expect(screenshot).toHaveBeenCalledWith(job, url, 'done')
    })

    it('fails properly if screenshot failed', async () => {
      job.browserCapabilities.screenshot = '.png'
      screenshot.mockImplementation(() => Promise.reject(new Error()))
      await done(job, url, getDoneInfo())
      expect(mockGenericError).toHaveBeenCalled()
      expect(stop).toHaveBeenCalledWith(job, url)
      expect(job.failed).not.toStrictEqual(true)
    })

    it('takes no screenshot if disabled', async () => {
      await done(job, url, getDoneInfo())
      expect(screenshot).not.toHaveBeenCalled()
    })

    it('associates the report to the qunitPage', async () => {
      await done(job, url, getDoneInfo())
      const { page } = get(job, url)
      expect(page.report).toStrictEqual(getDoneInfo())
    })

    it('collects and strips coverage information (coverage enabled)', async () => {
      const report = getDoneInfo()
      const coverage = {}
      report.__coverage__ = coverage
      job.coverage = true
      await done(job, url, report)
      expect(collect).toHaveBeenCalledWith(job, url, coverage)
      const { page } = get(job, url)
      expect(page.report).toStrictEqual(getDoneInfo())
    })

    it('collects but drops coverage information (coverage disabled)', async () => {
      const report = getDoneInfo()
      const coverage = {}
      report.__coverage__ = coverage
      await done(job, url, report)
      // collect is still called but ignored in coverage.js
      expect(collect).toHaveBeenCalledWith(job, url, coverage)
      const { page } = get(job, url)
      expect(page.report).toStrictEqual(getDoneInfo())
    })

    it('documents when the page ended', async () => {
      await done(job, url, getDoneInfo())
      const { page } = get(job, url)
      expect(page.end).toBeInstanceOf(Date)
    })

    it('fails if tests not started', async () => {
      delete job.qunitPages
      await expect(done(job, url, getDoneInfo())).rejects.toThrow(UTRError.QUNIT_ERROR('No QUnit page found for http://localhost:80/page1.html'))
      expect(stop).toHaveBeenCalledWith(job, url)
      expect(job.failed).toStrictEqual(true)
    })

    it('fails if URL does not exist', async () => {
      job.qunitPages = {}
      await expect(done(job, url, {})).rejects.toThrow(UTRError.QUNIT_ERROR('No QUnit page found for http://localhost:80/page1.html'))
      expect(stop).toHaveBeenCalledWith(job, url)
      expect(job.failed).toStrictEqual(true)
    })
  })

  describe('early start', () => {
    const jobEarlyStart = {
      screenshot: false,
      browserCapabilities: {
        screenshot: true
      }
    }

    beforeAll(async () => {
      await begin(jobEarlyStart, url, {
        isOpa: true,
        totalTests: 0,
        modules: []
      })
    })

    it('accepts new modules', async () => {
      await testStart(jobEarlyStart, url, {
        module: 'test.html?journey=1A',
        name: 'test 1a',
        testId: '1a',
        modules: [{
          name: 'module 1',
          tests: [{
            name: 'test 1a',
            testId: '1a'
          }]
        }]
      })
      const { testModule, page } = get(jobEarlyStart, url, { testId: '1a' })
      expect(testModule.name).toStrictEqual('module 1')
      expect(page.count).toStrictEqual(1)
    })

    it('accepts new tests', async () => {
      await testStart(jobEarlyStart, url, {
        module: 'test.html?journey=1A',
        name: 'test 1a',
        testId: '1a',
        modules: [{
          name: 'module 1',
          tests: [{
            name: 'test 1a',
            testId: '1a'
          }, {
            name: 'test 1b',
            testId: '1b'
          }]
        }]
      })
      const { testModule, page } = get(jobEarlyStart, url, { testId: '1b' })
      expect(testModule.name).toStrictEqual('module 1')
      expect(page.count).toStrictEqual(2)
    })

    it('accepts new modules on top of existing ones', async () => {
      await testStart(jobEarlyStart, url, {
        module: 'test.html?journey=2C',
        name: 'test 2c',
        testId: '2c',
        modules: [{
          name: 'module 1',
          tests: [{
            name: 'test 1a',
            testId: '1a'
          }, {
            name: 'test 1b',
            testId: '1b'
          }]
        }, {
          name: 'module 2',
          tests: [{
            name: 'test 2c',
            testId: '2c'
          }, {
            name: 'test 2d',
            testId: '2d'
          }]
        }]
      })
      const { testModule, page } = get(jobEarlyStart, url, { testId: '2c' })
      expect(testModule.name).toStrictEqual('module 2')
      expect(page.count).toStrictEqual(4)
    })

    it('waits before terminating tests', async () => {
      await testStart(jobEarlyStart, url, {
        module: 'test.html?journey=1A',
        name: 'test 1a',
        testId: '1a',
        modules: [{
          name: 'module 1',
          tests: [{
            name: 'test 1a',
            testId: '1a'
          }]
        }]
      })
      const done1 = done(jobEarlyStart, url, {
        failed: 0,
        passed: 1,
        total: 1
      })
      await testStart(jobEarlyStart, url, {
        module: 'test.html?journey=2C',
        name: 'test 2c',
        testId: '2c',
        modules: [{
          name: 'module 1',
          tests: [{
            name: 'test 1a',
            testId: '1a'
          }]
        }, {
          name: 'module 2',
          tests: [{
            name: 'test 2c',
            testId: '2c'
          }]
        }]
      })
      const done2 = done(jobEarlyStart, url, {
        failed: 0,
        passed: 2,
        total: 2
      })
      await Promise.all([done1, done2])
      expect(screenshot).toHaveBeenCalledTimes(1)
    })
  })

  describe('moduleId filtering', () => {
    const module1 = {
      name: 'module 1',
      moduleId: '1',
      tests: [{
        name: 'test 1a',
        testId: '1a'
      }]
    }
    const module2 = {
      name: 'module 2',
      moduleId: '2',
      tests: [{
        name: 'test 2a',
        testId: '2a'
      }]
    }
    const module3 = {
      name: 'module 3',
      moduleId: '3',
      tests: [{
        name: 'test 3a',
        testId: '3a'
      }]
    }

    function checkPageModules (url) {
      const { page: { modules } } = get(job, url)
      expect(modules.length).toStrictEqual(1)
      expect(modules[0]).toMatchObject({
        name: 'module 1',
        moduleId: '1',
        tests: [{
          name: 'test 1a',
          testId: '1a'
        }]
      })
    }

    describe('QUnit v1', () => {
      const urlWithModuleName = 'http://localhost:80/page1.html?module=module%201'

      beforeEach(async () => {
        await begin(job, urlWithModuleName, {
          isOpa: true,
          totalTests: 0,
          modules: [module1, module2]
        })
      })

      it('filters out module on startup', () => checkPageModules(urlWithModuleName))

      it('filters modules if new ones are added', async () => {
        await testStart(job, urlWithModuleName, {
          module: 'test.html?journey=1A',
          name: 'test 1a',
          testId: '1a',
          modules: [module1, module2, module3]
        })
        checkPageModules(urlWithModuleName)
      })
    })

    describe('QUnit v2', () => {
      const urlWithModuleId = 'http://localhost:80/page1.html?moduleId=1'

      beforeEach(async () => {
        await begin(job, urlWithModuleId, {
          isOpa: true,
          totalTests: 0,
          modules: [module1, module2]
        })
      })

      it('filters out module on startup', () => checkPageModules(urlWithModuleId))

      it('filters modules if new ones are added', async () => {
        await testStart(job, urlWithModuleId, {
          module: 'test.html?journey=1A',
          name: 'test 1a',
          testId: '1a',
          modules: [module1, module2, module3]
        })
        checkPageModules(urlWithModuleId)
      })
    })
  })
})
