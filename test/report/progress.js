const { getJobProgress } = require('../../src/get-job-progress')

module.exports = async (request, response, pageId, testId) => {
  delete require.cache[require.resolve('./job.js')]
  const job = require('./job.js')
  return getJobProgress(job, request, response, pageId, testId)
}
