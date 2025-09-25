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

async function findDependencyPath (job, name) {
  if (!localRoot) {
    [localRoot, globalRoot] = await Promise.all([
      npm(job, 'root'),
      npm(job, 'root', '--global')
    ])
  }
  const localPath = join(localRoot, name)
  if (await folderExists(localPath)) {
    return [localPath, false]
  }
  if (job.alternateNpmPath) {
    const alternatePath = join(job.alternateNpmPath, name)
    if (await folderExists(alternatePath)) {
      return [alternatePath, false]
    }
  }
  const globalPath = join(globalRoot, name)
  let justInstalled = false
  if (!await folderExists(globalPath)) {
    if (!job.npmInstall || job.offline) {
      throw UTRError.NPM_DEPENDENCY_NOT_FOUND(name)
    }
    const previousStatus = job.status
    job.status = `Installing ${name}...`
    await npm(job, 'install', name, '-g')
    justInstalled = true
    job.status = previousStatus
  }
  return [globalPath, justInstalled]
}

const noop = () => {}

function getSafeJobAndOutput (nullableJob) {
  if (nullableJob) {
    return { job: nullableJob, output: getOutput(nullableJob) }
  }
  return {
    job: {
      offline: true
    },
    output: {
      debug: noop,
      resolvedPackage: noop,
      packageNotLatest: noop
    }
  }
}

async function checkLatest (nullableJob, name, installedVersion) {
  const { job, output } = getSafeJobAndOutput(nullableJob)
  if (!job.offline) {
    output.debug('npm', `fetching latest version of package ${name}`)
    const latestVersion = await npm(job, 'view', name, 'version')
    if (latestVersion !== installedVersion) {
      output.packageNotLatest(name, latestVersion)
    }
  } else {
    output.debug('npm', `offline=${job.offline}`)
  }
}

module.exports = {
  resolveDependencyPath,
  checkLatest,

  async resolvePackage (nullableJob, name) {
    const { job, output } = getSafeJobAndOutput(nullableJob)
    let modulePath
    let justInstalled = false
    output.debug('npm', `resolving dependency path of package ${name}...`)
    try {
      modulePath = resolveDependencyPath(name)
    } catch (e) {
      output.debug('npm', e)
    }
    if (!modulePath) {
      output.debug('npm', `finding dependency path of package ${name}...`);
      [modulePath, justInstalled] = await findDependencyPath(job, name)
    }
    output.debug('npm', `opening installed package ${name}`)
    const installedPackage = require(join(modulePath, 'package.json'))
    const { version: installedVersion } = installedPackage
    output.resolvedPackage(name, modulePath, installedVersion)
    if (!justInstalled) {
      checkLatest(job, name, installedVersion)
    } else {
      output.debug('npm', `justInstalled=${justInstalled}`)
    }
    return modulePath
  }
}
