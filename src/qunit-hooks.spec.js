jest.mock('./browsers.js', () => ({
  screenshot: jest.fn(),
  stop: jest.fn()
}))
const { screenshot, stop } = require('./browsers')

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
  })

  describe('begin', () => {
    it('allocates qunitPages', async () => {
      const job = {}
      await begin(job, url, {
        modules: []
      })
      expect(job.qunitPages).not.toBeUndefined()
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
      expect(job.qunitPages[url]).toEqual({
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
    })

    it('resets the existing structure (retry)', async () => {
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
            }]
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
      expect(job.qunitPages[url]).toEqual({
        isOpa: false,
        failed: 0,
        passed: 0,
        tests: [{
          id: '1a'
        }, {
          id: '2b'
        }]
      })
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
      await log(job, url, { testId: '1a', runtime: 'timestamp' })
      expect(screenshot).toHaveBeenCalledWith(job, url, '1a-timestamp')
      expect(job.qunitPages[url]).toEqual({
        isOpa: true,
        failed: 0,
        passed: 0,
        tests: [{
          id: '1a',
          screenshots: ['timestamp']
        }, {
          id: '2b'
        }]
      })
    })
  })

  describe('testDone', () => {
    it('increases passed count when successful', async () => {
      const job = {}
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
      const report = { testId: '2b', failed: false }
      await testDone(job, url, report)
      expect(screenshot).not.toHaveBeenCalled()
      expect(job.qunitPages[url]).toEqual({
        isOpa: false,
        failed: 0,
        passed: 1,
        tests: [{
          id: '1a'
        }, {
          id: '2b',
          report
        }]
      })
    })

    describe('failure', () => {
      it('increases failed count and takes a screenshot', async () => {
        const job = {
          browserCapabilities: {
            screenshot: '.png'
          }
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
        const report = { testId: '2b', failed: true }
        await testDone(job, url, report)
        expect(screenshot).toHaveBeenCalledWith(job, url, '2b')
        expect(job.qunitPages[url]).toEqual({
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

      it('increases failed count', async () => {
        const job = {
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
        const report = { testId: '2b', failed: true }
        await testDone(job, url, report)
        expect(screenshot).not.toHaveBeenCalled()
        expect(job.qunitPages[url]).toEqual({
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
    const job = {

    }
  })
})
