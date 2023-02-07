'use strict'

const { writeFile } = require('fs/promises')

const append = (fileName, line) => writeFile(fileName, line + '\n', { flag: 'a+' })
const escape = value => {
  const stringValue = value.toString()
  if (stringValue.match(/\r|\n|\t|"/)) {
    return JSON.stringify(stringValue)
  }
  return stringValue
}

class CsvWriter {
  #fileName
  #ready
  #fields

  constructor (fileName) {
    this.#fileName = fileName
    this.#ready = Promise.resolve()
    this.#fields = []
  }

  get ready () {
    return this.#ready
  }

  append (records) {
    if (!Array.isArray(records)) {
      records = [records]
    }
    if (this.#fields.length === 0) {
      this.#fields = Object.keys(records[0]).filter(name => name !== 'timestamp')
      this.#ready = this.#ready.then(() => append(this.#fileName, `timestamp\t${this.#fields.join('\t')}`))
    }
    const lines = records.map(record => {
      const { timestamp = Date.now() } = record
      return [
        timestamp,
        ...this.#fields.map(name => escape(record[name]))
      ].join('\t')
    }).join('\n')
    this.#ready = this.#ready.then(() => append(this.#fileName, lines))
  }
}

module.exports = {
  buildCsvWriter (fileName) {
    return new CsvWriter(fileName)
  }
}
