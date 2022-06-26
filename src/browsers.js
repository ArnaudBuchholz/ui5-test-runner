'use strict'

const { fork, exec } = require('child_process')
const { join } = require('path')
const { stat, writeFile } = require('fs/promises')
const { recreateDir, filename } = require('./tools')
const { getPageTimeout } = require('./timeout')
const output = require('./output')

let lastScreenshotId = 0
const screenshots = {}

function npm (...args) {
  return new Promise((resolve, reject) => {
    const childProcess = exec(`npm ${args.join(' ')}`, (err, stdout, stderr) => {
      if (err) {
        reject(stderr)
      } else {
        resolve(stdout.trim())
      }
    })
    output.monitor(childProcess)
  })
}

async function folderExists (path) {
  try {
    const result = await stat(path)
    return result.isDirectory()
  } catch (e) {
    return false
  }
}

async function probe (job) {
  job.status = 'Probing browser instantiation command'
  const childProcess = fork(job.browser, ['capabilities'], { stdio: 'pipe' })
  const output = []
  childProcess.stdout.on('data', chunk => output.push(chunk.toString()))
  await new Promise(resolve => childProcess.on('close', resolve))
  const capabilities = Object.assign({
    modules: [],
    screenshot: false,
    console: false,
    scripts: false,
    parallel: true
  }, JSON.parse(output.join('')))
  job.browserCapabilities = capabilities
  const { modules } = capabilities
  const resolvedModules = {}
  if (modules.length) {
    const [npmLocalRoot, npmGlobalRoot] = await Promise.all([npm('root'), npm('root', '--global')])
    for await (const name of capabilities.modules) {
      const localModule = join(npmLocalRoot, name)
      if (await folderExists(localModule)) {
        resolvedModules[name] = localModule
      } else {
        const globalModule = join(npmGlobalRoot, name)
        if (!await folderExists(globalModule)) {
          job.status = `Installing ${name}...`
          await npm('install', name, '-g')
        }
        resolvedModules[name] = globalModule
      }
    }
  }
  job.browserCapabilities.modules = resolvedModules
}

function start (job, url, scripts = []) {
  if (!job.browsers) {
    job.browsers = {}
  }
  output.browserStart(url)
  const reportDir = join(job.tstReportDir, filename(url))
  const pageBrowser = {
    url,
    reportDir,
    scripts,
    retry: 0
  }
  const promise = new Promise(resolve => {
    pageBrowser.done = resolve
  })
  job.browsers[url] = pageBrowser
  run(job, pageBrowser)
  return promise.then(() => {
    output.browserStopped(url)
  })
}

async function run (job, pageBrowser) {
  const { url, retry, reportDir } = pageBrowser
  if (retry) {
    output.browserRetry(url, retry)
  }
  await recreateDir(reportDir)
  delete pageBrowser.stopped

  const browserConfig = {
    modules: job.browserCapabilities.modules,
    url,
    retry
  }
  const browserConfigPath = join(reportDir, 'browser.json')
  await writeFile(browserConfigPath, JSON.stringify(browserConfig))

  const childProcess = fork(job.browser, [browserConfigPath], { stdio: 'pipe' })
  output.monitor(childProcess)
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
  childProcess.on('close', () => {
    if (!pageBrowser.stopped) {
      output.browserClosed(url)
      stop(job, url, true)
    }
  })
}

async function screenshot (job, url, filename) {
  if (job.noScreenshot || !job.browserCapabilities || !job.browserCapabilities.screenshot) {
    return
  }
  const pageBrowser = job.browsers[url]
  if (pageBrowser) {
    const { childProcess } = pageBrowser
    if (childProcess.connected) {
      const id = ++lastScreenshotId
      const promise = new Promise(resolve => {
        screenshots[id] = resolve
      })
      childProcess.send({
        id,
        command: 'screenshot',
        filename
      })
      await promise
    }
  }
}

async function stop (job, url, retry = false) {
  const pageBrowser = job.browsers[url]
  if (pageBrowser) {
    pageBrowser.stopped = true
    const { childProcess, done, timeoutId } = pageBrowser
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    if (childProcess.connected) {
      childProcess.send({ command: 'stop' })
    }
    if (retry && ++pageBrowser.retry <= job.browserRetry) {
      run(job, pageBrowser)
    } else {
      delete job.browsers[url]
      done()
    }
  }
}

module.exports = { probe, start, screenshot, stop }
