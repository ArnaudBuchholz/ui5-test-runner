'use strict'

const { join } = require('path')
const { fork } = require('child_process')
const { cleanDir, createDir } = require('./tools')
const { readdir, readFile, stat, writeFile } = require('fs').promises
const { Readable } = require('stream')

const job = require('./job')

function nyc (...args) {
  console.log('nyc', ...args)
  const childProcess = fork(join(__dirname, '../node_modules/nyc/bin/nyc.js'), args, {
    stdio: 'inherit'
  })
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
      if (stats) {
        stats.size -= globalContextSearch.length + globalContextReplace.length
      }
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

const instrumentedSourceDir = join(job.covTempDir, 'instrumented')
const settingsPath = join(job.covTempDir, 'settings/nyc.json')

async function instrument () {
  job.status = 'Instrumenting'
  await cleanDir(job.covTempDir)
  await createDir(join(job.covTempDir, 'settings'))
  const settings = JSON.parse((await readFile(job.covSettings)).toString())
  settings.cwd = job.cwd
  await writeFile(settingsPath, JSON.stringify(settings))
  await nyc('instrument', job.webapp, instrumentedSourceDir, '--nycrc-path', settingsPath)
}

async function generateCoverageReport () {
  job.status = 'Generating coverage report'
  await cleanDir(job.covReportDir)
  await nyc('merge', job.covTempDir, join(job.covTempDir, 'coverage.json'))
  await nyc('report', '--reporter=lcov', '--temp-dir', job.covTempDir, '--report-dir', job.covReportDir, '--nycrc-path', settingsPath)
}

const mappings = [{
  match: /^\/(.*\.js)$/,
  file: join(instrumentedSourceDir, '$1'),
  'ignore-if-not-found': true,
  'custom-file-system': customFileSystem
}]

if (!job.coverage) {
  const nop = () => {}

  module.exports = {
    instrument: nop,
    generateCoverageReport: nop,
    mappings: []
  }
} else {
  module.exports = {
    instrument,
    generateCoverageReport,
    mappings
  }
}
