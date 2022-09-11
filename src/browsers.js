'use strict'

const { fork } = require('child_process')
const { join } = require('path')
const { writeFile, readFile, open, stat, unlink } = require('fs/promises')
const { recreateDir, filename, allocPromise } = require('./tools')
const { getPageTimeout } = require('./timeout')
const output = require('./output')
const { resolvePackage } = require('./npm')
const { UTRError } = require('./error')

let lastScreenshotId = 0
const screenshots = {}

async function instantiate (job, config) {
  const { dir, url } = config
  await recreateDir(dir)
  const browserConfig = {
    ...config,
    args: job.browserArgs
  }
  if (job.browserCapabilities) {
    const { modules } = job.browserCapabilities
    browserConfig.modules = modules
  }
  const browserConfigPath = join(dir, 'browser.json')
  await writeFile(browserConfigPath, JSON.stringify(browserConfig, undefined, 2))
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
      output.browserFailed(url, code, dir)
    }
    resolve(code)
  })
  childProcess.closed = promise
  childProcess.stdoutFilename = stdoutFilename
  childProcess.stderrFilename = stderrFilename
  return childProcess
}

async function probe (job) {
  if (job.browserCapabilities) {
    return
  }
  job.status = 'Probing browser instantiation command'

  async function execute (folder) {
    const dir = join(job.reportDir, folder)
    const capabilities = join(dir, 'capabilities.json')
    const childProcess = await instantiate(job, {
      url: 'about:blank',
      capabilities,
      dir
    })
    const code = await childProcess.closed
    if (code !== 0) {
      throw UTRError.BROWSER_PROBE_FAILED(code.toString())
    }
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
    return browserCapabilities
  }

  const browserCapabilities = await execute('probe')
  job.browserCapabilities = browserCapabilities

  const { modules } = browserCapabilities
  const resolvedModules = {}
  if (modules.length) {
    for await (const name of browserCapabilities.modules) {
      resolvedModules[name] = await resolvePackage(job, name)
    }
  }
  job.browserCapabilities.modules = resolvedModules
  if (browserCapabilities['probe-with-modules']) {
    job.browserCapabilities = await execute('probe/with-modules')
    job.browserCapabilities.modules = resolvedModules
  }
}

async function start (job, url, scripts = []) {
  if (!job.browsers) {
    job.browsers = {}
  }
  output.browserStart(url)
  const reportDir = join(job.reportDir, filename(url))
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
    if (pageBrowser.console.count) {
      try {
        await pageBrowser.console.flush
          .then(() => unlink(join(reportDir, 'console.jsont')))
      } catch (e) {
        // ignore
      }
    }
  }
  pageBrowser.console = {
    count: 0,
    byApi: {},
    flush: Promise.resolve()
  }
  await recreateDir(dir)
  delete pageBrowser.stopped
  const childProcess = await instantiate(job, {
    url,
    retry,
    scripts,
    dir
  })
  pageBrowser.childProcess = childProcess
  const timeout = getPageTimeout(job)
  if (timeout) {
    pageBrowser.timeoutId = setTimeout(() => {
      output.browserTimeout(url, dir)
      stop(job, url)
    }, timeout)
  }
  childProcess.on('message', message => {
    if (message.command === 'screenshot') {
      const { id } = message
      screenshots[id]()
      delete screenshots[id]
    } else if (message.command === 'console') {
      ++pageBrowser.console.count
      if (!pageBrowser.console.byApi[message.api]) {
        pageBrowser.console.byApi[message.api] = 1
      } else {
        ++pageBrowser.console.byApi[message.api]
      }
      pageBrowser.console.flush = pageBrowser.console.flush
        .then(() => writeFile(join(reportDir, 'console.jsont'), JSON.stringify({
          t: message.t,
          api: message.api,
          args: message.args
        }) + '\n', {
          flag: 'a+'
        }))
    }
  })
  childProcess.on('close', async code => {
    if (!pageBrowser.stopped) {
      output.browserClosed(url, code, dir)
      stop(job, url, true)
    }
  })
}

async function screenshot (job, url, filename) {
  if (!job.browserCapabilities.screenshot) {
    throw UTRError.BROWSER_SCREENSHOT_NOT_SUPPORTED()
  }
  try {
    const { childProcess, reportDir } = job.browsers[url]
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
      const result = await stat(absoluteFilename)
      if (!result.isFile() || result.size === 0) {
        throw new Error('File expected')
      }
      return absoluteFilename
    }
  } catch (e) {
    if (e.code === UTRError.BROWSER_SCREENSHOT_TIMEOUT_CODE) {
      throw e
    }
    throw UTRError.BROWSER_SCREENSHOT_FAILED(e.toString())
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
      const { promise: closeTimeout, resolve } = allocPromise()
      const timeoutId = setTimeout(resolve, job.browserCloseTimeout)
      await Promise.race([
        childProcess.closed,
        closeTimeout
      ])
      clearTimeout(timeoutId)
    }
    await pageBrowser.console.flush
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
