'use strict'

const { join } = require('path')
const { writeFile } = require('fs').promises
const { generateCoverageReport } = require('./coverage')
const { filename, allocPromise } = require('./tools')
const { fork } = require('child_process')
const { getOutput } = require('./output')

async function save (job) {
  // Ensure the file is treated as CommonJS
  await writeFile(join(job.reportDir, 'package.json'), '{"type": "commonjs"}')
  await writeFile(join(job.reportDir, 'job.js'), `module.exports = ${JSON.stringify(job, (key, value) => {
    if (value && value instanceof RegExp) {
      return value.toString()
    }
    return value
  }, 2)}`)
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
    try {
      await generateCoverageReport(job)
    } catch (e) {
      output.genericError(e)
      job.failed = true
    }
    job.status = 'Generating reports'
    job.end = new Date()
    job.failed = !!job.failed
    job.testPageHashes = job.testPageUrls.map(url => filename(url))
    output.debug('report', 'saving job...')
    await save(job)
    output.debug('report', 'job saved.')
    output.debug('report', 'generating text report...')
    await generateTextReport(job)
    output.debug('report', 'text report generated.')
    const promises = job.reportGenerator.map(generator => {
      output.debug('report', 'launching', generator, '...')
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
        output.debug('report', generator, 'ended with exit code', exitCode)
        if (exitCode !== 0) {
          output.reportGeneratorFailed(generator, exitCode, buffers)
        }
        resolve()
        output.debug('report', generator, 'resolved')
      })
      return promise
    })
    output.debug('report', 'generators count:', promises.length)
    await Promise.all(promises)
    job.status = 'Reports generated'
  }
}
