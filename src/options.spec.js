const { boolean, integer, url } = require('./options')
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
})
