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

function generateTextReport (job) {
  const { promise, resolve } = allocPromise()
  const childProcess = fork(
    join(__dirname, 'defaults/text-report.js'),
    [job.reportDir, process.stdout.columns || ''],
    {
      stdio: 'pipe',
      env: {
        ...process.env,
        ...job.env
      }
    }
  )
  getOutput(job).monitor(childProcess, true)
  childProcess.on('close', resolve)
  return promise
}

module.exports = {
  save,

  async generate (job) {
    const output = getOutput(job)
    job.end = new Date()
    job.failed = !!job.failed
    job.status = 'Generating reports'
    job.testPageHashes = job.testPageUrls.map(url => filename(url))
    await save(job)
    await generateTextReport(job)
    const promises = job.reportGenerator.map(generator => {
      const { promise, resolve } = allocPromise()
      const childProcess = fork(
        generator,
        [job.reportDir],
        {
          stdio: 'pipe',
          env: {
            ...process.env,
            ...job.env
          }
        }
      )
      const buffers = output.monitor(childProcess, false)
      childProcess.on('close', exitCode => {
        if (exitCode !== 0) {
          output.reportGeneratorFailed(generator, exitCode, buffers)
        }
        resolve()
      })
      return promise
    })
    promises.push(generateCoverageReport(job).catch(e => {
      output.genericError(e)
      job.failed = true
    }))
    await Promise.all(promises)
    job.status = 'Reports gemerated'
  }
}
