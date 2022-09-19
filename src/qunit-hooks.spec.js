jest.mock('./browsers.js', () => ({
  screenshot: jest.fn(),
  stop: jest.fn()
}))
const { screenshot, stop } = require('./browsers')

jest.mock('./coverage.js', () => ({
  collect: jest.fn()
}))
const { collect } = require('./coverage')

const {
  begin,
  log,
  testDone,
  done
} = require('./qunit-hooks.js')

describe('src/qunit-hooks', () => {
  const url = 'http://localhost:80/page1.html'

  beforeEach(() => {
    screenshot.mockClear()
    stop.mockClear()
  })

  describe('begin', () => {
    it('allocates qunitPages', async () => {
      const job = {}
      await begin(job, url, {
        modules: []
      })
      expect(job.qunitPages).not.toBeUndefined()
      expect(job.qunitPages[url]).not.toBeUndefined()
    })

    it('associates url to a structure', async () => {
      const job = {}
      await begin(job, url, {
        isOpa: false,
        totalTests: 2,
        modules: [{
          tests: [{
            testId: '1a'
          }, {
            testId: '2b'
          }]
        }, {
          tests: [{
            testId: '3c'
          }, {
            testId: '4d'
          }]
        }]
      })
      const qunitPage = job.qunitPages[url]
      expect(qunitPage).toMatchObject({
        isOpa: false,
        failed: 0,
        passed: 0,
        tests: [{
          id: '1a'
        }, {
          id: '2b'
        }, {
          id: '3c'
        }, {
          id: '4d'
        }]
      })
      expect(qunitPage.start).toBeInstanceOf(Date)
    })

    it('resets the existing structure (retry)', async () => {
      const start = 'Not a date'
      const job = {
        qunitPages: {
          [url]: {
            isOpa: false,
            failed: 2,
            passed: 5,
            tests: [{
              id: '1a',
              before: true
            }, {
              id: '2b',
              before: true
            }],
            start
          }
        }
      }
      await begin(job, url, {
        isOpa: false,
        totalTests: 2,
        modules: [{
          tests: [{
            testId: '1a'
          }, {
            testId: '2b'
          }]
        }]
      })
      const qunitPage = job.qunitPages[url]
      expect(job.qunitPages[url]).toMatchObject({
        isOpa: false,
        failed: 0,
        passed: 0,
        tests: [{
          id: '1a'
        }, {
          id: '2b'
        }]
      })
      expect(qunitPage.start).toBeInstanceOf(Date)
      expect(qunitPage.start).not.toEqual(start)
    })

    it('validates expected structure', async () => {
      const job = {}
      await expect(() => begin(job, url, {
        isOpa: false,
        totalTests: 1
        // missing modules
      })).rejects.toThrow()
      expect(stop).toHaveBeenCalledWith(job, url)
    })
  })

  describe('log', () => {
    it('does nothing when not OPA', async () => {
      const job = {}
      await begin(job, url, {
        isOpa: false,
        modules: []
      })
      await log(job, url, {})
      expect(screenshot).not.toHaveBeenCalled()
    })

    it('does nothing when screenshot is not available', async () => {
      const job = {
        browserCapabilities: {
          screenshot: false
        }
      }
      await begin(job, url, {
        isOpa: true,
        modules: []
      })
      await log(job, url, {})
      expect(screenshot).not.toHaveBeenCalled()
    })

    it('triggers a screenshot for OPA tests', async () => {
      const job = {
        browserCapabilities: {
          screenshot: '.png'
        }
      }
      await begin(job, url, {
        isOpa: true,
        modules: [{
          tests: [{
            testId: '1a'
          }, {
            testId: '2b'
          }]
        }]
      })
      await log(job, url, { testId: '1a', runtime: 't1' })
      expect(screenshot).toHaveBeenCalledWith(job, url, '1a-t1')
      await log(job, url, { testId: '1a', runtime: 't2' })
      expect(screenshot).toHaveBeenCalledWith(job, url, '1a-t2')
      expect(job.qunitPages[url]).toMatchObject({
        isOpa: true,
        failed: 0,
        passed: 0,
        tests: [{
          id: '1a',
          screenshots: ['t1', 't2']
        }, {
          id: '2b'
        }]
      })
    })
  })

  describe('testDone', () => {
    let job

    beforeEach(async () => {
      job = {
        browserCapabilities: {}
      }
      await begin(job, url, {
        isOpa: false,
        modules: [{
          tests: [{
            testId: '1a'
          }, {
            testId: '2b'
          }]
        }]
      })
    })

    it('increases passed count when successful', async () => {
      const report = { testId: '2b', failed: false }
      await testDone(job, url, report)
      expect(screenshot).not.toHaveBeenCalledWith(job, url, '2b')
      const qunitPage = job.qunitPages[url]
      expect(qunitPage).toMatchObject({
        isOpa: false,
        failed: 0,
        passed: 1,
        tests: [{
          id: '1a'
        }, {
          id: '2b',
          // end,
          report
        }]
      })
      expect(qunitPage.tests[1].end).toBeInstanceOf(Date)
    })

    describe('failure', () => {
      it('increases failed count and takes a screenshot', async () => {
        job.browserCapabilities.screenshot = '.png'
        const report = { testId: '2b', failed: true }
        await testDone(job, url, report)
        expect(screenshot).toHaveBeenCalledWith(job, url, '2b')
        const qunitPage = job.qunitPages[url]
        expect(qunitPage).toMatchObject({
          isOpa: false,
          failed: 1,
          passed: 0,
          tests: [{
            id: '1a'
          }, {
            id: '2b',
            // end,
            report
          }]
        })
        expect(qunitPage.tests[1].end).toBeInstanceOf(Date)
        expect(job.failed).toStrictEqual(true)
      })

      it('increases failed count only (no screenshot)', async () => {
        const report = { testId: '2b', failed: true }
        await testDone(job, url, report)
        expect(screenshot).not.toHaveBeenCalled()
        expect(job.qunitPages[url]).toMatchObject({
          isOpa: false,
          failed: 1,
          passed: 0,
          tests: [{
            id: '1a'
          }, {
            id: '2b',
            report
          }]
        })
        expect(job.failed).toStrictEqual(true)
      })
    })
  })

  describe('done', () => {
    let job

    beforeEach(() => {
      job = {
        browserCapabilities: {},
        qunitPages: {
          [url]: {}
        }
      }
    })

    it('stops the browser', async () => {
      await done(job, url, {})
      expect(stop).toHaveBeenCalledWith(job, url)
    })

    it('takes a screenshot if enabled', async () => {
      job.browserCapabilities.screenshot = '.png'
      await done(job, url, {})
      expect(screenshot).toHaveBeenCalledWith(job, url, 'done')
    })

    it('takes no screenshot if disabled', async () => {
      await done(job, url, {})
      expect(screenshot).not.toHaveBeenCalled()
    })

    it('associates the report to the qunitPage', async () => {
      const report = {}
      await done(job, url, report)
      expect(job.qunitPages[url].report).toStrictEqual(report)
    })

    it('collects and strips coverage information', async () => {
      const coverage = {}
      const report = {
        __coverage__: coverage
      }
      await done(job, url, report)
      expect(collect).toHaveBeenCalledWith(job, url, coverage)
      expect(report).toMatchObject({})
    })

    it('documents when the page ended', async () => {
      await done(job, url, {})
      expect(job.qunitPages[url].end).toBeInstanceOf(Date)
    })
  })
})
