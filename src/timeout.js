'use strict'

const job = require('./job')

module.exports = {
  getPageTimeout () {
    if (job.pageTimeout || job.globalTimeout) {
      if (job.globalTimeout) {
        return Math.min(job.globalTimeout - (new Date() - job.start), job.pageTimeout || Number.MAX_SAFE_INTEGER)
      }
      return job.pageTimeout
    }
    return 0
  },

  globallyTimedOut () {
    if (job.globalTimeout) {
      return new Date() - job.start > job.globalTimeout
    }
    return false
  }
}
