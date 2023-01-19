const job = require('./job.js')
const { getJobProgress } = require('../../src/get-job-progress')

module.exports = (request, response, pageId, testId) => getJobProgress(job, request, response, pageId, testId)
