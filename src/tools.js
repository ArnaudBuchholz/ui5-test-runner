'use strict'

const { dirname } = require('path')
const { mkdir, rm, stat } = require('fs').promises
const { createHash } = require('crypto')
const { createWriteStream } = require('fs')
const http = require('http')
const https = require('https')
const { unlink } = require('fs/promises')

const recursive = { recursive: true }

const stripUrlHash = url => url.split('#')[0]

const filename = url => {
  const hash = createHash('shake256', {
    outputLength: 8
  })
  hash.update(stripUrlHash(url))
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
const $w = Symbol('pad.w')
function pad (width) {
  if (!width) {
    width = process.stdout.columns || 80
  }
  const ops = {
    [$x] (widthLeft) {
      return ''.padStart(widthLeft, this.text)
    },
    [$lt] (widthLeft) {
      const { text, padding } = this
      if (text.length <= widthLeft) {
        return text.padEnd(widthLeft, padding)
      }
      return '...' + text.substring(text.length - widthLeft + 3)
    },
    [$w] (widthLeft, result, opIndex) {
      const { text } = this
      if (text.length < widthLeft && !text.includes('\n')) {
        return text.padEnd(widthLeft, ' ')
      }
      const lines = []
      text.split(/\r?\n/).forEach(line => {
        if (line.length <= widthLeft) {
          lines.push(line.padEnd(widthLeft, ' '))
        } else {
          for (let offset = 0; offset < line.length; offset += widthLeft - 1) {
            const part = line.slice(offset, offset + widthLeft - 1)
            if (part.length < widthLeft - 1) {
              lines.push(part.padEnd(widthLeft, ' '))
            } else {
              lines.push(`${part}↵`)
            }
          }
        }
      })
      const before = result.slice(0, opIndex).join('')
      const after = result.slice(opIndex + 1).join('')
      return lines.join(after + '\n' + before)
    }
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
      result[opIndex] = ops[op[$op]].call(op, widthLeft, result, opIndex)
    }
    return result.join('')
  }
}

pad.x = (text) => ({ [$op]: $x, text })
pad.lt = (text, padding = ' ') => ({ [$op]: $lt, text, padding })
pad.w = (text) => ({ [$op]: $w, text })

function allocPromise () {
  let resolve
  let reject
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  return { promise, resolve, reject }
}

async function download (url, filename) {
  const { hostname, port, origin } = new URL(url)
  const options = {
    hostname,
    port,
    path: url.substring(origin.length),
    method: 'GET'
  }
  const protocol = url.startsWith('https:') ? https : http
  await mkdir(dirname(filename), recursive)
  const output = createWriteStream(filename)
  const { promise, resolve, reject } = allocPromise()
  const request = protocol.request(options, async response => {
    if (response.statusCode !== 200) {
      reject(response.statusCode)
      output.end()
      await unlink(filename)
      return
    }
    response.on('error', reject)
    response.on('end', resolve)
    response.pipe(output)
  })
  request.on('error', reject)
  request.end()
  return promise
}

module.exports = {
  stripUrlHash,
  filename,
  cleanDir,
  createDir: dir => mkdir(dir, recursive),
  recreateDir: dir => cleanDir(dir).then(() => mkdir(dir, recursive)),
  extractPageUrl: headers => headers['x-page-url'],
  allocPromise,
  noop () {},
  pad,
  download
}
