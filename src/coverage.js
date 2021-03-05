'use strict'

const { join } = require('path')
const { fork } = require('child_process')
const { promisify } = require('util')
const { mkdir, readdir, readFile, rmdir, stat, writeFile } = require('fs')
const mkdirAsync = promisify(mkdir)
const rmdirAsync = promisify(rmdir)
const readdirAsync = promisify(readdir)
const readFileAsync = promisify(readFile)
const statAsync = promisify(stat)
const writeFileAsync = promisify(writeFile)
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
  stat: path => statAsync(path)
    .then(stats => {
      if (stats) {
        stats.size -= globalContextSearch.length + globalContextReplace.length
      }
      return stats
    }),
  readdir: readdirAsync,
  createReadStream: async (path) => {
    const buffer = (await readFileAsync(path))
      .toString()
      .replace(globalContextSearch, globalContextReplace)
    return Readable.from(buffer)
  }
}

const instrumentedSourceDir = join(job.covTempDir, 'instrumented')
const settingsPath = join(job.covTempDir, 'settings/nyc.json')

async function instrument () {
  job.status = 'Instrumenting'
  await rmdirAsync(job.covTempDir, { recursive: true })
  await mkdirAsync(join(job.covTempDir, 'settings'), { recursive: true })
  const settings = JSON.parse((await readFileAsync(job.covSettings)).toString())
  settings.cwd = job.cwd
  await writeFileAsync(settingsPath, JSON.stringify(settings))
  await nyc('instrument', job.webapp, instrumentedSourceDir, '--nycrc-path', settingsPath)
}

async function generateCoverageReport () {
  job.status = 'Generating coverage report'
  await rmdirAsync(job.covReportDir, { recursive: true })
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
