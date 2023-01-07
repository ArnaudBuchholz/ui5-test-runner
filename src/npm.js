const { exec } = require('child_process')
const { join } = require('path')
const { stat, readFile } = require('fs/promises')
const { UTRError } = require('./error')
const { getOutput } = require('./output')

function npm (job, ...args) {
  return new Promise((resolve, reject) => {
    const childProcess = exec(`npm ${args.join(' ')}`, (err, stdout, stderr) => {
      if (err) {
        reject(UTRError.NPM_FAILED(stderr))
      } else {
        resolve(stdout.trim())
      }
    })
    if (args[0] === 'install') {
      getOutput(job).monitor(childProcess)
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

async function outputPackage (job, name, path) {
  const packageTxt = (await readFile(join(path, 'package.json'))).toString()
  const packageJson = JSON.parse(packageTxt)
  const { version } = packageJson
  getOutput(job).resolvedPackage(name, path, version)
}

module.exports = {
  async resolvePackage (job, name) {
    if (!localRoot) {
      [localRoot, globalRoot] = await Promise.all([
        npm(job, 'root'),
        npm(job, 'root', '--global')
      ])
    }
    const localModule = join(localRoot, name)
    if (await folderExists(localModule)) {
      await outputPackage(job, name, localModule)
      return localModule
    }
    const globalModule = join(globalRoot, name)
    if (!await folderExists(globalModule)) {
      const previousStatus = job.status
      job.status = `Installing ${name}...`
      await npm(job, 'install', name, '-g')
      job.status = previousStatus
    }
    await outputPackage(job, name, globalModule)
    return globalModule
  }
}
