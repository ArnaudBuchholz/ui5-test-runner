'use strict'

const { InvalidArgumentError } = require('commander')

function integer (value) {
  const result = parseInt(value, 10)
  if (isNaN(result)) {
    throw new InvalidArgumentError('Invalid integer')
  }
  if (result < 0) {
    throw new InvalidArgumentError('Only >= 0')
  }
  return result
}

module.exports = {
  any (value) {
    return value
  },

  boolean (value, defaultValue) {
    if (value === undefined) {
      return !defaultValue
    }
    if (['true', 'yes', 'on'].includes(value)) {
      return true
    }
    if (['false', 'no', 'off'].includes(value)) {
      return false
    }
    throw new InvalidArgumentError('Invalid boolean')
  },

  regex (value) {
    try {
      return new RegExp(value)
    } catch (e) {
      throw new InvalidArgumentError('Invalid regex')
    }
  },

  integer,

  timeout (value) {
    const int = integer(value)
    if (value.endsWith('ms')) {
      return int
    }
    const specifier = value.substring(int.toString().length)
    if (['s', 'sec'].includes(specifier)) {
      return int * 1000
    }
    if (['m', 'min'].includes(specifier)) {
      return int * 60 * 1000
    }
    if (specifier) {
      throw new InvalidArgumentError('Invalid timeout')
    }
    return int
  },

  url (value) {
    if (!value.match(/^https?:\/\/[^ "]+$/)) {
      throw new InvalidArgumentError('Invalid URL')
    }
    return value
  },

  arrayOf (typeValidator) {
    return function (value, previousValue) {
      let result
      if (previousValue === undefined) {
        result = []
      } else {
        result = [...previousValue]
      }
      result.push(typeValidator(value))
      return result
    }
  }
}
