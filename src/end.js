const { fork } = require('node:child_process')
const { join } = require('node:path')
const { getOutput } = require('./output')
const { allocPromise } = require('./tools')

async function end (job) {
  const { endScript: end } = job
  const output = getOutput(job)
  const [script, ...args] = end.split(' ')

  job.status = 'Executing end script'

  output.debug('end', 'Starting script :', end)
  const childProcess = fork(
    script,
    [...args, join(job.reportDir, 'job.js')],
    {
      cwd: job.cwd,
      stdio: [0, 'pipe', 'pipe', 'ipc'],
      windowsHide: true,
      env: {
        ...process.env,
        ...job.env
      }
    }
  )

  const { promise: childProcessExit, resolve: childProcessExited } = allocPromise()
  childProcess.on('close', childProcessExited)
  output.monitor(childProcess)

  job.status = 'Waiting for script to end'

  if (job.endTimeout) {
    let timedOut = false
    const { promise: endTimeoutSignal, resolve: endTimeoutReached } = allocPromise()
    const timeoutId = setTimeout(() => {
      timedOut = true
      endTimeoutReached()
    }, job.endTimeout)

    await Promise.race([
      childProcessExit,
      endTimeoutSignal
    ])
    clearTimeout(timeoutId)

    if (timedOut) {
      childProcess.kill()
      throw new Error('Timeout while waiting for end script')
    }
  } else {
    await childProcessExit
  }

  output.debug('end', 'Ended with exit code :', childProcess.exitCode)

  // IMPORTANT : the end command CHANGES the exit code
  process.exitCode = childProcess.exitCode
}

module.exports = { end }
