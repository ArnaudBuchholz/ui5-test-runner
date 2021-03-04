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
const progress = require('./progress')

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

const tempDir = join(job.cwd, job.covTempDir)
const instrumentedSourceDir = join(tempDir, job.webapp)
const sourceDir = join(job.cwd, job.webapp)
const reportDir = join(job.cwd, job.covReportDir)
const settingsPath = join(tempDir, 'settings/nyc.json')

async function instrument () {
  progress('Instrumenting')

  await rmdirAsync(tempDir, { recursive: true })
  await mkdirAsync(join(tempDir, 'settings'), { recursive: true })
  const settings = JSON.parse((await readFileAsync(job.covSettings)).toString())
  settings.cwd = job.cwd
  await writeFileAsync(settingsPath, JSON.stringify(settings))
  await nyc('instrument', sourceDir, instrumentedSourceDir, '--nycrc-path', settingsPath)
}

async function generateCoverageReport () {
  progress('Generating coverage report')
  await rmdirAsync(reportDir, { recursive: true })
  await nyc('merge', tempDir, join(tempDir, 'coverage.json'))
  await nyc('report', '--reporter=lcov', '--temp-dir', tempDir, '--report-dir', reportDir, '--nycrc-path', settingsPath)
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
