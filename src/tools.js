'use strict'

const { mkdir, rmdir } = require('fs').promises

const recursive = { recursive: true }

module.exports = {
  filename: url => escape(url).replace(/\//g, '_'),
  cleanDir: dir => rmdir(dir, recursive),
  createDir: dir => mkdir(dir, recursive),
  recreateDir: dir => rmdir(dir, recursive).then(() => mkdir(dir, recursive))
}
