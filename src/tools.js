'use strict'

const { mkdir, rmdir } = require('fs')
const { promisify } = require('util')
const mkdirAsync = promisify(mkdir)
const rmdirAsync = promisify(rmdir)

const recursive = { recursive: true }

module.exports = {
  filename: url => escape(url).replace(/\//g, '_'),
  cleanDir: dir => rmdirAsync(dir, recursive),
  createDir: dir => mkdirAsync(dir, recursive),
  recreateDir: dir => rmdirAsync(dir, recursive).then(() => mkdirAsync(dir, recursive))
}
