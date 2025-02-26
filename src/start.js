const { exec } = require('child_process')
const { stat, readFile } = require('fs/promises')
const { join } = require('path')
const { getOutput } = require('./output')
const psTreeNodeCb = require('ps-tree')
const { promisify } = require('util')
const psTree = promisify(psTreeNodeCb)

async function start (job) {
  const { startWaitUrl: url, startWaitMethod: method } = job
  let { startCommand: start } = job
  const output = getOutput(job)
  const [command, ...parameters] = start.split(' ')

  job.status = 'Executing start command'

  // check if node
  if (command === 'node') {
    output.debug('start', `Replacing node with ${process.argv[0]}`)
    start = [process.argv[0], ...parameters].join(' ')
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

  let childProcessExited = false
  output.debug('start', 'Starting command :', start)
  const childProcess = exec(start, {
    cwd: job.cwd,
    windowsHide: true
  })
  childProcess.on('close', () => {
    output.debug('start', 'start command process exited')
    childProcessExited = true
  })
  output.monitor(childProcess)

  job.status = 'Waiting for URL to be reachable'

  const begin = Date.now()
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!childProcessExited && Date.now() - begin <= job.startTimeout) {
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

  if (childProcessExited) {
    throw new Error(`Start command failed with exit code ${childProcess.exitCode}`)
  }

  const stop = async () => {
    output.debug('start', 'Getting child processes...')
    const childProcesses = await psTree(childProcess.pid)
    for (const child of childProcesses) {
      output.debug('start', 'Terminating process', child.PID)
      try {
        process.kill(child.PID, 'SIGKILL')
      } catch (e) {
        output.debug('start', 'Failed to terminate process', child.PID, ':', e)
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
