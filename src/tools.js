'use strict'

const fsPromises = require('fs').promises
const { mkdir, stat } = fsPromises
const { createHash } = require('crypto')

let rm
/* istanbul ignore next */ // Hard to test both in the same run
if (process.version > 'v14.14') {
  rm = fsPromises.rm
} else {
  rm = fsPromises.rmdir
}

const recursive = { recursive: true }

const filename = url => {
  const hash = createHash('sha256')
  hash.update(url)
  return hash.digest('base64')
    .replace(/=/g, '')
    .replace(/\//g, '_')
}

const cleanDir = async dir => {
  try {
    await stat(dir)
    await rm(dir, recursive)
  } catch (err) {
    // Ignore
  }
}

module.exports = {
  filename,
  cleanDir,
  createDir: dir => mkdir(dir, recursive),
  recreateDir: dir => cleanDir(dir).then(() => mkdir(dir, recursive)),
  extractUrl: headers => headers.referer.match(/http:\/\/[^/]+(?::\d+)?(\/.*)/)[1],
  allocPromise () {
    let resolve
    let reject
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve
      reject = _reject
    })
    return { promise, resolve, reject }
  },
  noop () {}
}
