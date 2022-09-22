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
  const hash = createHash('shake256', {
    outputLength: 8
  })
  hash.update(url)
  return hash.digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '_')
    .replace(/\//g, '$')
}

const cleanDir = async dir => {
  try {
    await stat(dir)
    await rm(dir, recursive)
  } catch (err) {
    // Ignore
  }
}

const $op = Symbol('pad.op')
const $x = Symbol('pad.x')
const $lt = Symbol('pad.lt')

function pad (width) {
  if (!width) {
    width = process.stdout.columns || 80
  }
  return (strings, ...values) => {
    const result = []
    let op
    let opIndex
    const length = strings.reduce((total, string, index) => {
      result.push(string)
      total += string.length
      let value = values[index]
      if (value === null || value === undefined) {
        return total
      }
      if (value[$op]) {
        if (opIndex !== undefined) {
          throw new Error('Only one operator is allowed')
        }
        op = value
        opIndex = result.length
        result.push(value)
      } else {
        if (typeof value !== 'string') {
          value = value.toString()
        }
        result.push(value)
        total += value.length
      }
      return total
    }, 0)
    if (op !== undefined) {
      const widthLeft = width - length
      if (op[$op] === $x) {
        result[opIndex] = ''.padStart(widthLeft, op.text)
      } else if (op[$op] === $lt) {
        const { text, padding } = op
        if (text.length <= widthLeft) {
          result[opIndex] = text.padEnd(widthLeft, padding)
        } else {
          result[opIndex] = '...' + text.substring(text.length - widthLeft + 3)
        }
      }
    }
    return result.join('')
  }
}

pad.x = (text) => ({ [$op]: $x, text })
pad.lt = (text, padding = ' ') => ({ [$op]: $lt, text, padding })

module.exports = {
  filename,
  cleanDir,
  createDir: dir => mkdir(dir, recursive),
  recreateDir: dir => cleanDir(dir).then(() => mkdir(dir, recursive)),
  extractPageUrl: headers => headers['x-page-url'],
  allocPromise () {
    let resolve
    let reject
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve
      reject = _reject
    })
    return { promise, resolve, reject }
  },
  noop () {},
  pad
}
