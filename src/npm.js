const { exec } = require('child_process')
const { join } = require('path')
const { stat } = require('fs/promises')
const { UTRError } = require('./error')
const output = require('./output')

function npm (...args) {
  return new Promise((resolve, reject) => {
    const childProcess = exec(`npm ${args.join(' ')}`, (err, stdout, stderr) => {
      if (err) {
        reject(UTRError.NPM_FAILED(stderr))
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

let localRoot
let globalRoot

module.exports = async function (job, name) {
  if (!localRoot) {
    [localRoot, globalRoot] = await Promise.all([npm('root'), npm('root', '--global')])
  }
  const localModule = join(localRoot, name)
  if (await folderExists(localModule)) {
    return localModule
  }
  const globalModule = join(globalRoot, name)
  if (!await folderExists(globalModule)) {
    const previousStatus = job.status
    job.status = `Installing ${name}...`
    await npm('install', name, '-g')
    job.status = previousStatus
  }
  return globalModule
}
