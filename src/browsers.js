'use strict'

const { fork, exec } = require('child_process')
const { join } = require('path')
const { stat, writeFile, readFile, open } = require('fs/promises')
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
    if (args[0] === 'install') {
      output.monitor(childProcess)
    }
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
    screenshot: null,
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
  const promise = new Promise(resolve => {
    pageBrowser.done = resolve
  })
  job.browsers[url] = pageBrowser
  run(job, pageBrowser)
  await promise
  output.browserStopped(url)
}

async function run (job, pageBrowser) {
  const { url, retry, reportDir, scripts } = pageBrowser
  if (retry) {
    output.browserRetry(url, retry)
  }
  await recreateDir(reportDir)
  delete pageBrowser.stopped
  const browserConfig = {
    modules: job.browserCapabilities.modules,
    url,
    retry,
    scripts,
    args: job.browserArgs
  }
  const browserConfigPath = join(reportDir, 'browser.json')
  await writeFile(browserConfigPath, JSON.stringify(browserConfig))
  let stdoutFilename
  let stderrFilename
  if (retry) {
    stdoutFilename = join(reportDir, `stdout-${retry}.txt`)
    stderrFilename = join(reportDir, `stderr-${retry}.txt`)
  } else {
    stdoutFilename = join(reportDir, 'stdout.txt')
    stderrFilename = join(reportDir, 'stderr.txt')
  }
  const stdout = await open(stdoutFilename, 'w')
  const stderr = await open(stderrFilename, 'w')
  const childProcess = fork(job.browser, [browserConfigPath], {
    stdio: [0, stdout, stderr, 'ipc']
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
    await stdout.close()
    await stderr.close()
    if (code !== 0) {
      output.browserFailed(url, stdoutFilename, stderrFilename)
    }
  })
}

async function screenshot (job, url, filename) {
  if (job.noScreenshot || !job.browserCapabilities || !job.browserCapabilities.screenshot) {
    return
  }
  const pageBrowser = job.browsers[url]
  if (pageBrowser) {
    const { childProcess, reportDir } = pageBrowser
    const absoluteFilename = join(reportDir, filename + job.browserCapabilities.screenshot)
    if (childProcess.connected) {
      const id = ++lastScreenshotId
      const promise = new Promise(resolve => {
        screenshots[id] = resolve
      })
      childProcess.send({
        id,
        command: 'screenshot',
        filename: absoluteFilename
      })
      await promise
      return absoluteFilename
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
