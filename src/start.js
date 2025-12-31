const { exec } = require('child_process')
const { stat, readFile } = require('fs/promises')
const { join } = require('path')
const { getOutput } = require('./output')
const { platform } = require('os')
const { allocPromise } = require('./tools')

async function start (job) {
  const { startWaitUrl: url, startWaitMethod: method } = job
  let { startCommand: start } = job
  const output = getOutput(job)
  const [command, ...parameters] = start.split(' ')

  job.status = 'Executing start command'

  // check if node
  if (command === 'node') {
    let [node] = process.argv
    if (node.includes(' ')) {
      node = `"${node}"`
    }
    output.debug('start', `Replacing node with ${node}`)
    start = [node, ...parameters].join(' ')
  } else {
    // check if existing NPM script
    const packagePath = join(job.cwd, 'package.json')
    try {
      const packageStat = await stat(packagePath)
      if (packageStat.isFile()) {
        output.debug('start', 'Found package.json in cwd')
        const packageFile = JSON.parse(await readFile(packagePath, 'utf-8'))
        if (packageFile.scripts[command]) {
          output.debug('start', 'Found matching start script in package.json')
          start = `npm run ${start}`
        }
      }
    } catch (e) {
      output.debug('start', 'Missing or invalid package.json in cwd', e)
    }
  }

  let startProcessExited = false
  output.debug('start', 'Starting command :', start)
  const startProcess = exec(start, {
    cwd: job.cwd,
    windowsHide: true
  })
  startProcess.on('close', () => {
    output.debug('start', 'Start command process exited')
    startProcessExited = true
  })
  output.monitor(startProcess)

  job.status = 'Waiting for URL to be reachable'

  const begin = Date.now()
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!startProcessExited && Date.now() - begin <= job.startTimeout) {
    try {
      const response = await fetch(url, { method })
      output.debug('start', url, response.status)
      if (response.status === 200) {
        break
      }
    } catch (e) {
      output.debug('start', url, e)
      await new Promise(resolve => setTimeout(resolve, 250))
    }
  }

  if (startProcessExited) {
    throw new Error(`Start command failed with exit code ${startProcess.exitCode}`)
  }

  const stop = async () => {
    job.status = 'Terminating start command'
    if (platform() === 'win32') {
      const killProcess = exec(`taskkill /F /PID ${startProcess.pid}`)
      const { promise, resolve } = allocPromise()
      killProcess.on('close', resolve)
      output.monitor(killProcess)
      await promise
    } else {
      try {
        process.kill(startProcess.pid)
      } catch {
        // ignore error
      }
    }
  }

  if (Date.now() - begin > job.startTimeout) {
    await stop()
    throw new Error(`Timeout while waiting for ${url}`)
  }

  return {
    stop
  }
}

module.exports = { start }
