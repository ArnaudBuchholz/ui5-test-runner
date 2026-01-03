const { spawn } = require('child_process')
const { readFile, access, constants } = require('fs/promises')
const { join } = require('path')
const { getOutput } = require('./output')
const { platform } = require('os')
const { allocPromise } = require('./tools')

async function start (job) {
  const { startWaitUrl: url, startWaitMethod: method } = job
  const { startCommand: start } = job
  const output = getOutput(job)
  let [command, ...parameters] = start.split(' ')

  job.status = 'Executing start command'

  // check if existing NPM script
  if (command !== 'node' && parameters.length === 0) {
    const packagePath = join(job.cwd, 'package.json')
    try {
      await access(packagePath, constants.F_OK)
      output.debug('start', 'Found package.json in cwd')
      const packageFile = JSON.parse(await readFile(packagePath, 'utf-8'))
      if (packageFile.scripts[command]) {
        output.debug('start', 'Found matching script in package.json')
        // grab npm-cli path
        const { promise, resolve } = allocPromise()
        const npmChildProcess = spawn('npm', {
          shell: true,
          encoding: 'utf8'
        })
        npmChildProcess.on('close', resolve)
        const npmOutput = []
        npmChildProcess.stdout.on('data', (data) => npmOutput.push(data.toString()))
        await promise
        const [, version, path] = /^npm@([^ ]+) (.*)$/gm.exec(npmOutput.join(''))
        output.debug('start', `npm@${version} ${path}`)
        parameters = [join(path, 'bin/npm-cli.js'), 'run', command]
        command = 'node'
      }
    } catch (e) {
      output.debug('start', 'Missing or invalid package.json in cwd', e)
    }
  }

  if (command === 'node') {
    const [node] = process.argv
    output.debug('start', `Replacing node with ${node}`)
    command = node
  }

  let startProcessExited = false
  output.debug('start', 'Spawning', [command, ...parameters])
  const startProcess = spawn(command, parameters, {
    cwd: job.cwd,
    windowsHide: true
  })
  startProcess.on('close', () => {
    output.debug('start', 'Start command process exited')
    startProcessExited = true
  })
  output.monitor(startProcess)
  output.debug('start', `Spawned process id ${startProcess.pid}`)

  job.status = 'Waiting for URL to be reachable'

  const begin = Date.now()
  let lastError
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!startProcessExited && Date.now() - begin <= job.startTimeout) {
    try {
      const response = await fetch(url, { method })
      output.debug('start', url, response.status)
      if (response.status === 200) {
        break
      }
    } catch (e) {
      if (e.toString() !== lastError) {
        output.debug('start', url, e)
        lastError = e.toString()
      }
      await new Promise(resolve => setTimeout(resolve, 250))
    }
  }

  if (startProcessExited) {
    throw new Error(`Start command failed with exit code ${startProcess.exitCode}`)
  }

  const stop = async () => {
    job.status = 'Terminating start command'
    if (platform() === 'win32') {
      const killProcess = spawn('taskkill', ['/F', '/T', '/PID', startProcess.pid], {
        windowsHide: true
      })
      const { promise, resolve } = allocPromise()
      killProcess.on('close', resolve)
      output.monitor(killProcess)
      await promise
    } else {
      try {
        process.kill(-startProcess.pid)
      } catch (error) {
        output.debug('start', 'kill(-) failed', error)
        return
      }
    }
    const begin = Date.now()
    // eslint-disable-next-line no-unmodified-loop-condition
    while (!startProcessExited && Date.now() - begin <= job.startTimeout) {
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    if (startProcessExited) {
      // Additional waiting time to release handles
      await new Promise(resolve => setTimeout(resolve, 250))
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
