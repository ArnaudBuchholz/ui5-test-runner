'use strict'

const { InvalidArgumentError } = require('commander')

module.exports = {
  boolean (value) {
    if (['true', 'yes', 'on'].includes(value)) {
      return true
    } else if (['false', 'no', 'off'].includes(value)) {
      return false
    }
    throw new InvalidArgumentError('Invalid boolean')
  },

  integer (value) {
    const result = parseInt(value, 10)
    if (isNaN(result)) {
      throw new InvalidArgumentError('Invalid integer')
    } else if (result < 0) {
      throw new InvalidArgumentError('Only >= 0')
    }
    return result
  },

  url (value) {
    if (!value.match(/^https?:\/\/[^ "]+$/)) {
      throw new InvalidArgumentError('Invalid URL')
    }
    return value
  }
}
