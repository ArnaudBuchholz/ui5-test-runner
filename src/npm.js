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

module.exports = {
  async resolvePackage (job, name) {
    if (!localRoot) {
      [localRoot, globalRoot] = await Promise.all([
        npm(job, 'root'),
        npm(job, 'root', '--global')
      ])
    }
    let modulePath
    let justInstalled = false
    const localPath = join(localRoot, name)
    if (await folderExists(localPath)) {
      modulePath = localPath
    } else {
      const globalPath = join(globalRoot, name)
      if (!await folderExists(globalPath)) {
        const previousStatus = job.status
        job.status = `Installing ${name}...`
        await npm(job, 'install', name, '-g')
        justInstalled = true
        job.status = previousStatus
      }
      modulePath = globalPath
    }
    const output = getOutput(job)
    const installedPackage = JSON.parse((await readFile(join(modulePath, 'package.json'))).toString())
    const { version: installedVersion } = installedPackage
    output.resolvedPackage(name, modulePath, installedVersion)
    if (!justInstalled) {
      const latestVersion = await npm(job, 'view', name, 'version')
      if (latestVersion !== installedVersion) {
        output.packageNotLatest(name, latestVersion)
      }
    }
    return modulePath
  }
}
