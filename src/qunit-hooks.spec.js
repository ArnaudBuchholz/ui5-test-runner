const {
  begin,
  log
} = require('./qunit-hooks.js')

describe('src/qunit-hooks', () => {
  const url = 'http://localhost:80/page1.html'

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
  })

  describe('log', () => {
    it('does nothing when not OPA', async () => {
      const job = {}
      await begin(job, url, {
        isOpa: false,
        modules: []
      })
      await log(job, url, {})
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
    })

    it('does nothing when screenshot is not available', async () => {
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
      await log(job, url, { testId: '1a', timestamp: 'timestamp' })
    })
  })
})
