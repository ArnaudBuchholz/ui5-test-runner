const { exec } = require('child_process')
const { sep, join } = require('path')
const { stat } = require('fs/promises')
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

function resolveDependencyPath (name) {
  require(name)
  const pattern = `${sep}node_modules${sep}${name}${sep}`
  const path = Object.keys(require.cache).filter(path => path.includes(pattern))[0]
  if (path) {
    const pos = path.indexOf(pattern)
    return path.substring(0, pos + pattern.length - 1)
  }
}

module.exports = {
  resolveDependencyPath,

  async resolvePackage (job, name) {
    let modulePath
    let justInstalled = false
    try {
      modulePath = resolveDependencyPath(name)
    } catch (e) {
    }
    if (!modulePath) {
      if (!localRoot) {
        [localRoot, globalRoot] = await Promise.all([
          npm(job, 'root'),
          npm(job, 'root', '--global')
        ])
      }
      const localPath = join(localRoot, name)
      if (await folderExists(localPath)) {
        modulePath = localPath
      } else {
        const globalPath = join(globalRoot, name)
        if (!await folderExists(globalPath)) {
          if (!job.npmInstall) {
            throw UTRError.NPM_DEPENDENCY_NOT_FOUND(name)
          }
          const previousStatus = job.status
          job.status = `Installing ${name}...`
          await npm(job, 'install', name, '-g')
          justInstalled = true
          job.status = previousStatus
        }
        modulePath = globalPath
      }
    }
    const output = getOutput(job)
    const installedPackage = require(join(modulePath, 'package.json'))
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
