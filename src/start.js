const { exec } = require('child_process')
const { stat, readFile } = require('fs/promises')
const { join } = require('path')
const { getOutput } = require('./output')
const pidtree = require('pidtree')

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
    const begin = new Date()
    // eslint-disable-next-line no-unmodified-loop-condition
    while (!startProcessExited && Date.now() - begin <= job.startTimeout) {
      output.debug('start', `Getting start command ${startProcess.pid} child processes...`)
      let childProcesses
      try {
        childProcesses = await pidtree(startProcess.pid, { advanced: true })
      } catch (e) {
        output.genericError(e)
        break
      }
      output.debug('start', 'Child processes', JSON.stringify(childProcesses))
      if (childProcesses.length === 0) {
        try {
          output.debug('start', 'Terminating start command')
          process.kill(startProcess.pid, 'SIGKILL')
        } catch (e) {
          output.debug('start', 'Failed to terminate start command', startProcess.pid, ':', e)
        }
      } else {
        const depth = {}
        let deepest = 1
        let deepless = childProcesses.length
        while (deepless > 0) {
          for (const { ppid, pid } of childProcesses) {
            if (ppid === startProcess.pid) {
              depth[pid] = 1
              --deepless
            } else {
              const parentDepth = depth[ppid]
              if (parentDepth !== undefined) {
                depth[pid] = parentDepth + 1
                deepest = Math.max(deepest, parentDepth + 1)
                --deepless
              }
            }
          }
        }
        output.debug('start', 'Child processes', JSON.stringify(depth), 'terminating', deepest)
        for (const { pid } of childProcesses) {
          if (depth[pid] === deepest) {
            output.debug('start', 'Terminating start child process', pid)
            try {
              process.kill(pid, 'SIGKILL')
            } catch (e) {
              output.debug('start', 'Failed to terminate start child process', pid, ':', e)
            }
          }
        }
      }
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    if (!startProcessExited) {
      output.failedToTerminateStartCommand()
      startProcess.kill()
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
