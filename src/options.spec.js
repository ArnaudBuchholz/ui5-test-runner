const { any, boolean, integer, timeout, url, arrayOf } = require('./options')
const { InvalidArgumentError } = require('commander')

function checkType ({ method, validValues, invalidValues }) {
  describe(method.name, () => {
    if (Array.isArray(validValues)) {
      validValues = validValues.reduce((map, validValue) => {
        map[validValue] = validValue
        return map
      }, {})
    }
    Object.keys(validValues).forEach(validValue => {
      const expectedValue = validValues[validValue]
      it(`accepts ${JSON.stringify(validValue)}`, () => {
        expect(method(validValue)).toBe(expectedValue)
      })
    })
    invalidValues.forEach(invalidValue => {
      it(`rejects ${JSON.stringify(invalidValue)}`, () => {
        expect(() => method(invalidValue)).toThrowError(InvalidArgumentError)
      })
    })
  })
}

describe('src/options', () => {
  checkType({
    method: any,
    validValues: {
      true: 'true',
      123: '123'
    },
    invalidValues: [
    ]
  })

  checkType({
    method: boolean,
    validValues: {
      true: true,
      yes: true,
      on: true,
      false: false,
      no: false,
      off: false
    },
    invalidValues: [
      '',
      'anything'
    ]
  })

  describe('boolean (invert)', () => {
    it('inverts default value (false)', () => {
      expect(boolean(undefined, false)).toBe(true)
    })

    it('inverts default value (true)', () => {
      expect(boolean(undefined, true)).toBe(false)
    })
  })

  checkType({
    method: integer,
    validValues: {
      0: 0,
      1: 1,
      10: 10,
      100: 100,
      1000: 1000,
      10000: 10000
    },
    invalidValues: [
      '',
      '-1',
      '-10000',
      'abc'
    ]
  })

  checkType({
    method: timeout,
    validValues: {
      0: 0,
      1: 1,
      10: 10,
      100: 100,
      1000: 1000,
      10000: 10000,
      '10ms': 10,
      '10s': 10000,
      '10sec': 10000,
      '10m': 600000,
      '10min': 600000
    },
    invalidValues: [
      '',
      '1abc',
      '1msec',
      '1mins'
    ]
  })

  checkType({
    method: url,
    validValues: [
      'https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/testsuite.qunit.html',
      'http://localhost:8085/test.html?a=b'
    ],
    invalidValues: [
      '',
      '-1',
      'abc',
      'ftp://server.com/path'
    ]
  })

  describe('arrayOf', () => {
    it('builds a type validator that aggregates validated values in an array', () => {
      const validator = arrayOf(integer)
      const value = validator('2', validator('1'))
      expect(value).toStrictEqual([1, 2])
    })
  })
})
