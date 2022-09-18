'use strict'

const { join } = require('path')
const { writeFile } = require('fs').promises
const { generateCoverageReport } = require('./coverage')
const { filename, allocPromise } = require('./tools')
const { fork } = require('child_process')
const output = require('./output')

async function serialize (job, filename, json) {
  await writeFile(join(job.reportDir, `${filename}.js`), `module.exports = ${JSON.stringify(json, undefined, 2)}`)
}

async function save (job) {
  await serialize(job, 'job', job)
}

module.exports = {
  save,

  async generate (job) {
    job.end = new Date()
    job.status = 'Generating report'
    job.failed = 0
    const pages = []
    job.testPageUrls.forEach(url => {
      const page = job.qunitPages[url]
      if (page && page.report) {
        pages.push({
          url,
          failed: page.report.failed
        })
        job.failed += page.report.failed
      } else {
        pages.push({
          url,
          failed: -1
        })
        job.failed += 1
      }
    })
    output.results(pages)
    job.testPageHashes = job.testPageUrls.map(url => filename(url))
    await save(job)
    const promises = job.reportGenerator.map(generator => {
      const { promise, resolve } = allocPromise()
      const childProcess = fork(generator, [job.reportDir], {
        stdio: [0, 0, 0, 'ipc']
      })
      childProcess.on('close', resolve)
      return promise
    })
    promises.push(generateCoverageReport(job))
    await Promise.all(promises)
    output.timeSpent(job.start)
    job.status = 'Done'
  }
}
