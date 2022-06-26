'use strict'

const fsPromises = require('fs').promises
const { mkdir, stat } = fsPromises

let rm
/* istanbul ignore next */ // Hard to test both in the same run
if (process.version > 'v14.14') {
  rm = fsPromises.rm
} else {
  rm = fsPromises.rmdir
}

const recursive = { recursive: true }

const filename = url => {
  const [, protocol, host, rawPort, relativeUrl] = url.match(/(?:(https?):\/\/([^:/]+)(?::(\d+))?)?\/(.*)/)
  const port = rawPort || protocol === 'https' ? '443' : '80'
  let base
  if (host) {
    base = host + '_' + port + '_' + relativeUrl
  } else {
    base = relativeUrl
  }
  return encodeURIComponent(base)
    .replace(/\//g, '_')
    .replace(/%([0-9a-z]{2})/ig, (match, hexa) => `_${hexa}_`)
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
  extractUrl: headers => headers.referer.match(/http:\/\/[^/]+(?::\d+)?(\/.*)/)[1]
}
