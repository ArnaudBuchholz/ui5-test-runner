'use strict'

const { createReadStream } = require('fs')
const readline = require('readline')

const unescape = value => {
  if (value.startsWith('"') && value.endsWith('"')) {
    return JSON.parse(value)
  }
  return value
}

async function * buildCsvReader (fileName) {
  const fileStream = createReadStream(fileName)
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })
  let headers
  for await (const line of rl) {
    const fields = line.split('\t')
    if (headers === undefined) {
      headers = fields
      continue
    }
    const record = {}
    headers.forEach((field, index) => {
      record[field] = unescape(fields[index])
    })
    yield record
  }
}

module.exports = {
  buildCsvReader
}
