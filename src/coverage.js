'use strict'

const { join, dirname, isAbsolute, relative, sep } = require('path')
const { fork } = require('child_process')
const { cleanDir, createDir, filename, download, allocPromise } = require('./tools')
const { readdir, readFile, stat, writeFile, access, constants } = require('fs').promises
const { Readable } = require('stream')
const { getOutput, newProgress } = require('./output')
const { resolvePackage } = require('./npm')
const { promisify } = require('util')
const { UTRError } = require('./error')
const { $remoteOnLegacy } = require('./symbols')

const $nycSettingsPath = Symbol('nycSettingsPath')
const $coverageFileIndex = Symbol('coverageFileIndex')
const $coverageRemote = Symbol('coverageRemote')

let nycInstallationPath
let nycScript

async function setupNyc (job) {
  if (!nycInstallationPath) {
    nycInstallationPath = resolvePackage(job, 'nyc')
  }
  nycScript = join(await nycInstallationPath, 'bin/nyc.js')
}

async function nyc (job, ...args) {
  const output = getOutput(job)
  output.nyc(...args)
  const childProcess = fork(nycScript, args, { stdio: 'pipe' })
  output.monitor(childProcess)
  const { promise, resolve } = allocPromise()
  childProcess.on('close', resolve)
  return promise
}

async function safeNyc (job, ...args) {
  const code = await nyc(job, ...args)
  if (code !== 0) {
    const [command] = args
    throw UTRError.NYC_FAILED(`nyc ${command} failed with code ${code}`)
  }
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
  await setupNyc(job)
  job[$nycSettingsPath] = join(job.coverageTempDir, 'settings/.nycrc.json')
  await cleanDir(job.coverageTempDir)
  await createDir(join(job.coverageTempDir, 'settings'))
  const settings = JSON.parse((await readFile(job.coverageSettings)).toString())
  settings.cwd = job.webapp
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
  job.nycSettings = settings
  if (job.mode === 'url') {
    if (!job[$remoteOnLegacy]) {
      job[$coverageRemote] = true
      getOutput(job).instrumentationSkipped()
      return
    }
  }
  job.status = 'Instrumenting'
  await safeNyc(job, 'instrument', job.webapp, join(job.coverageTempDir, 'instrumented'), '--nycrc-path', job[$nycSettingsPath])
}

function getUrlOrigin (job) {
  const { origin } = new URL(job.url[0])
  if (job.url.some(url => new URL(url).origin !== origin)) {
    getOutput(job).assumingOneOrigin()
  }
  return origin
}

async function buildAllIndex (job) {
  async function scanFs (path, onFolder, onFile) {
    const items = await readdir(path)
    await onFolder(items.length)
    for (const item of items) {
      const itemPath = join(path, item)
      const itemStat = await stat(itemPath)
      if (itemStat.isDirectory()) {
        await scanFs(itemPath, onFolder, onFile)
      } else {
        await onFile(itemPath, (await readFile(itemPath)).toString())
      }
    }
  }

  const output = getOutput(job)
  output.debug('coverage', 'Build index for all files...')
  const progress = newProgress(job, 'Build index for all files', 1, 0)

  try {
    const index = []
    let scan
    let start
    if (job.mode === 'legacy' || job[$remoteOnLegacy]) {
      scan = scanFs
      start = join(job.coverageTempDir, 'instrumented')
    } else {
      scan = require(job.coverageRemoteScanner)
      start = getUrlOrigin(job)
    }

    await scan(
      start,
      count => {
        progress.total += count
        ++progress.count
      },
      async (file, source) => {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          output.debug('coverage', file)
          try {
            const coverageData = source
              .match(/coverageData\s*=\s*({[^;]*});/)[1]
              .replace(/([^"])(\w+):/g, (_, before, name) => `${before}"${name}":`)
            const [, coveragePath] = coverageData.match(/"path"\s*:\s*"([^"]+)"/)
            const UNDEFINED = '__undefined__'
            const validatedCoverageData = JSON.stringify(
              JSON.parse(coverageData.replace(/\bundefined\b/g, `"${UNDEFINED}"`)),
              (key, value) => {
                if (value === UNDEFINED) {
                  return undefined
                }
                return value
              }
            )
            index.push(`"${coveragePath}": ${validatedCoverageData}`)
          } catch (e) {
            output.debug('coverage', `Error when extracting all coverage for ${file}`, e)
          }
        } else {
          output.debug('coverage', `Ignore all coverage for ${file}`)
        }
        ++progress.count
      }
    )
    if (index.length === 0) {
      output.noInfoForAllCoverage()
    } else {
      await writeFile(join(job.coverageTempDir, 'all-index.json'), `{${index.join(',')}}`)
    }
  } catch (e) {
    output.genericError(e, e.url)
    output.noInfoForAllCoverage()
  } finally {
    progress.done()
  }
}

async function getReadableSource (job, pathOrUrl) {
  if (isAbsolute(pathOrUrl)) {
    try {
      await access(pathOrUrl, constants.R_OK)
      return pathOrUrl
    } catch (e) {}
  }
  try {
    const filePath = join(job.webapp, pathOrUrl)
    await access(filePath, constants.R_OK)
    return filePath
  } catch (e) {}
  try {
    const origin = getUrlOrigin(job)
    if (!job.coverageSourceDir) {
      job.coverageSourceDir = join(job.coverageTempDir, 'sources')
    }
    const filePath = join(job.coverageSourceDir, pathOrUrl)
    await download(origin + pathOrUrl, filePath)
    return filePath
  } catch (e) {}
}

async function checkAllSourcesAreAvailable (job, coverageFilename) {
  const output = getOutput(job)
  job.status = 'Checking remote source files'
  output.debug('coverage', 'Checking remote source files...')
  const coverageData = require(coverageFilename)
  const filenames = Object.keys(coverageData)
  let changes = false
  let basePath
  for (const filename of filenames) {
    const fileData = coverageData[filename]
    const filePath = await getReadableSource(job, fileData.path)
    if (!filePath) {
      // TODO this will compromise coverage report generation
      continue
    }
    if (filePath && filePath !== fileData.path) {
      fileData.path = filePath
      changes = true
    }
    if (filename !== filePath) {
      delete coverageData[filename]
      coverageData[filePath] = fileData
      changes = true
    }
    const fileFolder = dirname(filePath)
    if (basePath === undefined) {
      basePath = fileFolder
    } else {
      const diff = relative(basePath, fileFolder).split(sep)
      while (diff.shift() === '..') {
        basePath = dirname(basePath)
      }
    }
  }
  if (basePath !== job.nycSettings.cwd) {
    job.nycSettings.cwd = basePath
    await writeFile(job[$nycSettingsPath], JSON.stringify(job.nycSettings))
  }
  if (changes) {
    await writeFile(coverageFilename, JSON.stringify(coverageData))
  }
}

async function generateCoverageReport (job) {
  job.status = 'Generating coverage report'
  if (job.nycSettings.all) {
    await buildAllIndex(job)
  }
  const output = getOutput(job)
  output.debug('coverage', 'Generating coverage report...')
  await cleanDir(job.coverageReportDir)
  const coverageMergedDir = join(job.coverageTempDir, 'merged')
  await createDir(coverageMergedDir)
  const coverageFilename = join(coverageMergedDir, 'coverage.json')
  await safeNyc(job, 'merge', job.coverageTempDir, coverageFilename)
  if (job[$coverageRemote]) {
    await checkAllSourcesAreAvailable(job, coverageFilename)
  }
  const reporters = job.coverageReporters.map(reporter => `--reporter=${reporter}`)
  if (!job.coverageReporters.includes('text')) {
    reporters.push('--reporter=text')
  }
  const checks = []
  if (job.coverageCheckBranches || job.coverageCheckFunctions || job.coverageCheckLines || job.coverageCheckStatements) {
    if (!job.coverageReporters.includes('lcov')) {
      reporters.push('--reporter=lcov')
    }
    checks.push(
      `--branches=${job.coverageCheckBranches}`,
      `--functions=${job.coverageCheckFunctions}`,
      `--lines=${job.coverageCheckLines}`,
      `--statements=${job.coverageCheckStatements}`,
      '--check-coverage'
    )
  }
  const returnCode = await nyc(job, 'report', ...reporters, ...checks, '--temp-dir', coverageMergedDir, '--report-dir', job.coverageReportDir, '--nycrc-path', job[$nycSettingsPath])
  if (checks.length) {
    // The checks are not triggered if the coverage is empty
    const lcov = await stat(join(job.coverageReportDir, 'lcov.info'))
    if (lcov.size === 0) {
      throw UTRError.NYC_FAILED('No coverage information extracted')
    }
    if (returnCode === 1) {
      // Assuming coverage report shows the error
      output.debug('coverage', `nyc report failed with code ${returnCode}`)
      job.failed = true
    }
  } else if (returnCode !== 0) {
    throw UTRError.NYC_FAILED(`nyc report failed with code ${returnCode}`)
  }
}

module.exports = {
  instrument: job => job.coverage && instrument(job),
  async collect (job, url, coverageData) {
    if (!job.coverage) {
      return
    }
    job[$coverageFileIndex] = (job[$coverageFileIndex] || 0) + 1
    const coverageFileName = join(job.coverageTempDir, `${filename(url)}_${job[$coverageFileIndex]}.json`)
    getOutput(job).debug('coverage', `saved coverage in '${coverageFileName}'`)
    await writeFile(coverageFileName, JSON.stringify(coverageData))
  },
  generateCoverageReport: job => job.coverage ? generateCoverageReport(job) : Promise.resolve(),
  mappings: async job => {
    if (!job.coverage) {
      return []
    }
    const instrumentedBasePath = join(job.coverageTempDir, 'instrumented')
    const instrumentedMapping = {
      match: /(.*\.js)(\?.*)?$/,
      cwd: instrumentedBasePath,
      file: '$1'
    }
    if (job.mode === 'legacy' || job[$remoteOnLegacy]) {
      return [{
        ...instrumentedMapping,
        'custom-file-system': job.debugCoverageNoCustomFs ? undefined : customFileSystem
      }]
    }
    if (job.mode === 'url' && job.coverageProxy) {
      await setupNyc(job)
      // Assuming all files are coming from the same server
      const { origin } = new URL(job.url[0])
      let instrument
      try {
        const { createInstrumenter } = require(join(await nycInstallationPath, 'node_modules/istanbul-lib-instrument'))
        const instrumenter = createInstrumenter({
          produceSourceMap: true,
          coverageGlobalScope: 'window.top',
          coverageGlobalScopeFunc: false
        })
        instrument = promisify(instrumenter.instrument.bind(instrumenter))
      } catch (e) {
        // Recent version of nyc offers a different interface
        const createInstrumenter = require(join(await nycInstallationPath, 'lib/instrumenters/istanbul.js'))
        const instrumenter = createInstrumenter({
          produceSourceMap: true
        })
        instrument = async function (code, sourcePath) {
          return instrumenter.instrumentSync(code, sourcePath, { registerMap: () => {} })
            // TODO use regular expression !
            .replace(globalContextSearch, globalContextReplace)
        }
      }
      const sources = {}
      return [{
        match: /(.*\.js)(\?.*)?$/,
        custom: async (request, response, url) => {
          if (!url.match(job.coverageProxyInclude) || url.match(job.coverageProxyExclude)) {
            getOutput(job).debug('coverage', 'coverage_proxy ignore', url)
            return
          }
          const instrumentedSourcePath = join(instrumentedBasePath, url)
          try {
            await access(instrumentedSourcePath, constants.R_OK)
            return
          } catch (e) {}
          if (!sources[url]) {
            sources[url] = (async () => {
              const sourcePath = await getReadableSource(job, url)
              getOutput(job).debug('coverage', 'coverage_proxy instrument', url, sourcePath)
              if (sourcePath) {
                const source = (await readFile(sourcePath)).toString()
                const instrumentedSource = await instrument(source, sourcePath)
                await createDir(dirname(instrumentedSourcePath))
                await writeFile(instrumentedSourcePath, instrumentedSource)
                delete sources[url]
              }
            })()
          }
          await sources[url]
        }
      },
      instrumentedMapping,
      {
        match: /(.*)$/,
        url: `${origin}$1`
      }]
    }
    return []
  }
}
