'use strict'

const { join, dirname } = require('path')
const { fork } = require('child_process')
const { cleanDir, createDir, filename, allocPromise } = require('./tools')
const { readdir, readFile, stat, writeFile } = require('fs').promises
const { createWriteStream } = require('fs')
const { Readable } = require('stream')
const { getOutput } = require('./output')
const { resolvePackage } = require('./npm')
const http = require('http')
const https = require('https')

const $nycSettingsPath = Symbol('nycSettingsPath')
const $coverageFileIndex = Symbol('coverageFileIndex')
const $coverageRemote = Symbol('coverageRemote')

let nycScript

async function nyc (job, ...args) {
  const output = getOutput(job)
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
  if (!nycScript) {
    const nyc = await resolvePackage(job, 'nyc')
    nycScript = join(nyc, 'bin/nyc.js')
  }
  job[$nycSettingsPath] = join(job.coverageTempDir, 'settings/nyc.json')
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
  await writeFile(job[$nycSettingsPath], JSON.stringify(settings))
  if (job.mode === 'url') {
    const port = job.port.toString()
    const useLocal = job.url.some(url => {
      // ignore host name since the machine might be exposed with any name
      const parsedUrl = new URL(url)
      return parsedUrl.port === port
    })
    if (!useLocal) {
      getOutput(job).instrumentationSkipped()
      job[$coverageRemote] = true
      return
    }
  }
  job.status = 'Instrumenting'
  await nyc(job, 'instrument', job.webapp, join(job.coverageTempDir, 'instrumented'), '--nycrc-path', job[$nycSettingsPath])
}

async function generateCoverageReport (job) {
  job.status = 'Generating coverage report'
  await cleanDir(job.coverageReportDir)
  const coverageMergedDir = join(job.coverageTempDir, 'merged')
  await createDir(coverageMergedDir)
  const coverageFilename = join(coverageMergedDir, 'coverage.json')
  await nyc(job, 'merge', job.coverageTempDir, coverageFilename)
  if (job[$coverageRemote]) {
    job.status = 'Collecting remote source files'
    // Assuming all files are coming from the same server
    const baseUrl = new URL(job.testPageUrls[0])
    const options = {
      hostname: baseUrl.hostname,
      port: baseUrl.port,
      method: 'GET'
    }
    const protocol = baseUrl.protocol === 'https:' ? https : http
    const sourcesBasePath = join(job.coverageTempDir, 'sources')
    const coverageData = require(coverageFilename)
    const filenames = Object.keys(coverageData)
    for (const filename of filenames) {
      const fileData = coverageData[filename]
      const { path } = fileData
      const filePath = join(sourcesBasePath, path)
      fileData.path = filePath
      await createDir(dirname(filePath))
      const output = createWriteStream(filePath)
      const { promise, resolve, reject } = allocPromise()
      const request = protocol.request({ ...options, path }, response => {
        response.on('error', reject)
        response.on('end', resolve)
        response.pipe(output)
      })
      request.on('error', reject)
      request.end()
      await promise
    }
    await writeFile(coverageFilename, JSON.stringify(coverageData))
  }
  const reporters = job.coverageReporters.map(reporter => `--reporter=${reporter}`)
  await nyc(job, 'report', ...reporters, '--temp-dir', coverageMergedDir, '--report-dir', job.coverageReportDir, '--nycrc-path', job[$nycSettingsPath])
}

module.exports = {
  instrument: job => job.coverage && instrument(job),
  async collect (job, url, coverageData) {
    job[$coverageFileIndex] = (job[$coverageFileIndex] || 0) + 1
    const coverageFileName = join(job.coverageTempDir, `${filename(url)}_${job[$coverageFileIndex]}.json`)
    if (job.debugCoverage) {
      getOutput(job).wrap(() => console.log('coverage', coverageFileName))
    }
    await writeFile(coverageFileName, JSON.stringify(coverageData))
  },
  generateCoverageReport: job => job.coverage && generateCoverageReport(job),
  mappings: job => job.coverage
    ? [{
        match: /^\/(.*\.js)$/,
        file: join(job.coverageTempDir, 'instrumented', '$1'),
        'ignore-if-not-found': true,
        'custom-file-system': job.debugCoverageNoCustomFs ? undefined : customFileSystem
      }]
    : []
}
