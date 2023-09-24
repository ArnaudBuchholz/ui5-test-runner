'use strict'

module.exports = {
  getPageTimeout (job) {
    if (job.pageTimeout || job.globalTimeout) {
      if (job.globalTimeout) {
        return Math.min(job.globalTimeout - (new Date() - job.start), job.pageTimeout || Number.MAX_SAFE_INTEGER)
      }
      return job.pageTimeout
    }
    return 0
  },

  globallyTimedOut (job) {
    if (job.globalTimeout) {
      return new Date() - job.start > job.globalTimeout
    }
    return false
  },

  pageTimedOut (job, url) {
    const page = job.qunitPages && job.qunitPages[url]
    if (page) {
      const now = new Date()
      page.end = now
      page.timedOut = true
      page.modules.forEach(module => {
        module.tests.forEach(test => {
          if (!test.report) {
            ++page.failed
            if (test.start && !test.end) {
              test.end = now
            }
            test.logs ??= []
            test.logs.push({
              result: false,
              message: 'Page timed out'
            })
            test.report = {
              skipped: false,
              todo: false,
              failed: 1,
              passed: 0,
              total: 1
            }
          }
        })
      })
      job.failed = true
      job.timedOut = true
    }
  }
}
