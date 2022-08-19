'use strict'

const { fork } = require('child_process')
const { join } = require('path')
const { writeFile, readFile, open, stat } = require('fs/promises')
const { recreateDir, filename, allocPromise } = require('./tools')
const { getPageTimeout } = require('./timeout')
const output = require('./output')
const { resolvePackage } = require('./npm')
const { UTRError } = require('./error')

let lastScreenshotId = 0
const screenshots = {}

async function instantiate (job, config) {
  const { dir } = config
  await recreateDir(dir)
  const browserConfig = {
    ...config,
    args: job.browserArgs
  }
  const browserConfigPath = join(dir, 'browser.json')
  await writeFile(browserConfigPath, JSON.stringify(browserConfig))
  const stdoutFilename = join(dir, 'stdout.txt')
  const stderrFilename = join(dir, 'stderr.txt')
  const stdout = await open(stdoutFilename, 'w')
  const stderr = await open(stderrFilename, 'w')
  const childProcess = fork(job.browser, [browserConfigPath], {
    stdio: [0, stdout, stderr, 'ipc']
  })
  const { promise, resolve } = allocPromise()
  childProcess.on('close', async code => {
    await stdout.close()
    await stderr.close()
    if (code !== 0) {
      output.browserFailed(dir, stdoutFilename, stderrFilename)
    }
    resolve(code)
  })
  childProcess.closed = promise
  childProcess.stdoutFilename = stdoutFilename
  childProcess.stderrFilename = stderrFilename
  return childProcess
}

async function probe (job) {
  job.status = 'Probing browser instantiation command'
  const dir = join(job.tstReportDir, 'probe')
  const capabilities = join(dir, 'capabilities.json')
  const childProcess = await instantiate(job, {
    url: 'about:blank',
    capabilities,
    dir
  })
  await childProcess.closed
  let browserCapabilities
  try {
    browserCapabilities = Object.assign({
      modules: [],
      screenshot: null,
      console: false,
      scripts: false,
      parallel: true
    }, JSON.parse((await readFile(capabilities)).toString()))
  } catch (e) {
    throw UTRError.MISSING_OR_INVALID_BROWSER_CAPABILITIES(e.message)
  }
  job.browserCapabilities = browserCapabilities
  const { modules } = browserCapabilities
  const resolvedModules = {}
  if (modules.length) {
    for await (const name of browserCapabilities.modules) {
      resolvedModules[name] = await resolvePackage(job, name)
    }
  }
  job.browserCapabilities.modules = resolvedModules
}

async function start (job, url, scripts = []) {
  if (!job.browsers) {
    job.browsers = {}
  }
  output.browserStart(url)
  const reportDir = join(job.tstReportDir, filename(url))
  const resolvedScripts = []
  for await (const script of scripts) {
    if (script.endsWith('.js')) {
      const scriptFilename = join(__dirname, 'inject', script)
      const scriptContent = (await readFile(scriptFilename)).toString()
      resolvedScripts.push(scriptContent)
    } else {
      resolvedScripts.push(script)
    }
  }
  if (resolvedScripts.length) {
    resolvedScripts.unshift(`window['ui5-test-runner/base-host'] = 'http://localhost:${job.port}'
`)
  }
  const pageBrowser = {
    url,
    reportDir,
    scripts: resolvedScripts,
    retry: 0
  }
  const { promise, resolve, reject } = allocPromise()
  pageBrowser.done = resolve
  pageBrowser.failed = reject
  job.browsers[url] = pageBrowser
  await run(job, pageBrowser)
  await promise
  output.browserStopped(url)
}

async function run (job, pageBrowser) {
  const { url, retry, reportDir, scripts } = pageBrowser
  let dir = reportDir
  if (retry) {
    output.browserRetry(url, retry)
    dir = join(dir, retry.toString())
  }
  await recreateDir(dir)
  delete pageBrowser.stopped
  const childProcess = await instantiate(job, {
    modules: job.browserCapabilities.modules,
    url,
    retry,
    scripts,
    dir
  })
  pageBrowser.childProcess = childProcess
  const timeout = getPageTimeout(job)
  if (timeout) {
    pageBrowser.timeoutId = setTimeout(() => {
      output.browserTimeout(url)
      stop(job, url)
    }, timeout)
  }
  childProcess.on('message', message => {
    if (message.command === 'screenshot') {
      const { id } = message
      screenshots[id]()
      delete screenshots[id]
    }
  })
  childProcess.on('close', async code => {
    if (!pageBrowser.stopped) {
      output.browserClosed(url)
      stop(job, url, true)
    }
  })
}

async function screenshot (job, url, filename) {
  if (!job.browserCapabilities.screenshot) {
    throw UTRError.BROWSER_SCREENSHOT_NOT_SUPPORTED()
  }
  const pageBrowser = job.browsers[url]
  if (pageBrowser) {
    const { childProcess, reportDir } = pageBrowser
    const absoluteFilename = join(reportDir, filename + job.browserCapabilities.screenshot)
    if (childProcess.connected) {
      const id = ++lastScreenshotId
      const { promise, resolve, reject } = allocPromise()
      screenshots[id] = resolve
      childProcess.send({
        id,
        command: 'screenshot',
        filename: absoluteFilename
      })
      const timeoutId = setTimeout(() => {
        reject(UTRError.BROWSER_SCREENSHOT_TIMEOUT())
      }, job.screenshotTimeout)
      await promise
      clearTimeout(timeoutId)
      try {
        const result = await stat(absoluteFilename)
        if (!result.isFile() || result.size === 0) {
          throw new Error('File expected')
        }
      } catch (e) {
        throw UTRError.BROWSER_SCREENSHOT_FAILED(e.toString())
      }
      return absoluteFilename
    }
  }
}

async function stop (job, url, retry = false) {
  const pageBrowser = job.browsers[url]
  if (pageBrowser) {
    pageBrowser.stopped = true
    const { childProcess, done, failed, timeoutId } = pageBrowser
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    if (childProcess.connected) {
      childProcess.send({ command: 'stop' })
    }
    if (retry) {
      if (++pageBrowser.retry <= job.browserRetry) {
        run(job, pageBrowser)
      } else {
        failed(UTRError.BROWSER_FAILED())
      }
    } else {
      delete job.browsers[url]
      done()
    }
  }
}

module.exports = { probe, start, screenshot, stop }
