'use strict'

const { join } = require('path')
const { fork } = require('child_process')
const { cleanDir, createDir, filename } = require('./tools')
const { readdir, readFile, stat, writeFile } = require('fs').promises
const { Readable } = require('stream')
const output = require('./output')
const { resolvePackage } = require('./npm')

let nycScript

async function nyc (...args) {
  output.nyc(...args)
  const childProcess = fork(nycScript, args, { stdio: 'pipe' })
  output.monitor(childProcess)
  let done
  const promise = new Promise(resolve => { done = resolve })
  childProcess.on('close', done)
  return promise
}

const globalContextSearch = 'var global=new Function("return this")();'
const globalContextReplace = 'var global=window.top;'

const customFileSystem = {
  stat: path => stat(path)
    .then(stats => {
      stats.size -= globalContextSearch.length + globalContextReplace.length
      return stats
    }),
  readdir,
  createReadStream: async (path) => {
    const buffer = (await readFile(path))
      .toString()
      .replace(globalContextSearch, globalContextReplace)
    return Readable.from(buffer)
  }
}

async function instrument (job) {
  job.status = 'Instrumenting'
  if (!nycScript) {
    const nyc = await resolvePackage(job, 'nyc')
    nycScript = join(nyc, 'bin/nyc.js')
  }
  job.nycSettingsPath = join(job.coverageTempDir, 'settings/nyc.json')
  await cleanDir(job.coverageTempDir)
  await createDir(join(job.coverageTempDir, 'settings'))
  const settings = JSON.parse((await readFile(job.coverageSettings)).toString())
  settings.cwd = job.cwd
  if (!settings.exclude) {
    settings.exclude = []
  }
  settings.exclude.push(join(job.coverageTempDir, '**'))
  if (job.cache) {
    settings.exclude.push(join(job.cache, '**'))
  }
  settings.exclude.push(join(job.reportDir, '**'))
  settings.exclude.push(join(job.coverageReportDir, '**'))
  await writeFile(job.nycSettingsPath, JSON.stringify(settings))
  await nyc('instrument', job.webapp, join(job.coverageTempDir, 'instrumented'), '--nycrc-path', job.nycSettingsPath)
}

async function generateCoverageReport (job) {
  job.status = 'Generating coverage report'
  await cleanDir(job.coverageReportDir)
  await nyc('merge', job.coverageTempDir, join(job.coverageTempDir, 'coverage.json'))
  const reporters = job.coverageReporters.split(',').map(reporter => `--reporter=${reporter}`)
  await nyc('report', ...reporters, '--temp-dir', job.coverageTempDir, '--report-dir', job.coverageReportDir, '--nycrc-path', job.nycSettingsPath)
}

module.exports = {
  instrument: job => job.coverage && instrument(job),
  async collect (job, url, coverageData) {
    const coverageFileName = join(job.coverageTempDir, `${filename(url)}.json`)
    await writeFile(coverageFileName, JSON.stringify(coverageData))
  },
  generateCoverageReport: job => job.coverage && generateCoverageReport(job),
  mappings: job => job.coverage
    ? [{
        match: /^\/(.*\.js)$/,
        file: join(job.coverageTempDir, 'instrumented', '$1'),
        'ignore-if-not-found': true,
        'custom-file-system': customFileSystem
      }]
    : []
}
