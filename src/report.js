'use strict'

const { join } = require('path')
const { writeFile } = require('fs').promises
const { generateCoverageReport } = require('./coverage')
const { filename, allocPromise } = require('./tools')
const { fork } = require('child_process')
const { getOutput } = require('./output')

async function serialize (job, filename, json) {
  await writeFile(join(job.reportDir, `${filename}.js`), `module.exports = ${JSON.stringify(json, (key, value) => {
    if (value && value instanceof RegExp) {
      return value.toString()
    }
    return value
  }, 2)}`)
}

async function save (job) {
  await serialize(job, 'job', job)
}

module.exports = {
  save,

  async generate (job) {
    const output = getOutput(job)
    job.end = new Date()
    job.failed = !!job.failed
    job.status = 'Generating reports'
    output.results()
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
