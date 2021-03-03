'use strict'

const { join } = require('path')
const { spawn } = require('child_process')
const { promisify } = require('util')
const { readdir, readFile, rmdir, stat } = require('fs')
const rmdirAsync = promisify(rmdir)
const readdirAsync = promisify(readdir)
const readFileAsync = promisify(readFile)
const statAsync = promisify(stat)
const { Readable } = require('stream')

const job = require('./job')

function nyc (...args) {
  const process = spawn('node', [join(__dirname, '../node_modules/nyc/bin/nyc.js'), ...args], {
    stdio: 'inherit'
  })
  let done
  const promise = new Promise(resolve => { done = resolve })
  process.on('close', done)
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

async function instrument () {
  console.log('Instrumenting...')
  await rmdirAsync(tempDir, { recursive: true })
  await nyc('instrument', sourceDir, instrumentedSourceDir, '--nycrc-path', job.covSettings)
}

async function generateCoverageReport () {
  // if (job.coverage) {
  //   const coverageFile = rel(`nyc/${results.id}.json`)
  //   const coverageStat = await statAsync(coverageFile)
  //   if (coverageStat) {
  //     coverageFiles.push(coverageFile)
  //   } else {
  //     console.log('coverage file is missing')
  //   }

  await nyc('merge', tempDir, join(tempDir, 'coverage.json'))
  await nyc('report', '--reporter=lcov', '--temp-dir', tempDir, '--report-dir', reportDir)
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
