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

  append (record) {
    if (this.#fields.length === 0) {
      this.#fields = Object.keys(record)
      this.#ready = this.#ready.then(() => append(this.#fileName, `timestamp\t${this.#fields.join('\t')}`))
    }
    const line = [
      Date.now(),
      ...this.#fields.map(name => escape(record[name]))
    ].join('\t')
    this.#ready = this.#ready.then(() => append(this.#fileName, line))
  }
}

module.exports = {
  buildCsvWriter (fileName) {
    return new CsvWriter(fileName)
  }
}
