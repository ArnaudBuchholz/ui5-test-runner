const executeIf = require('./if')

describe('if', () => {
  describe('NODE_MAJOR_VERSION', () => {
    it('exposes NODE_MAJOR_VERSION as a number', () => {
      expect(typeof executeIf({
        if: 'NODE_MAJOR_VERSION'
      })).toStrictEqual('number')
    })

    it('enables condition on NODE_MAJOR_VERSION', () => {
      expect(executeIf({
        if: 'NODE_MAJOR_VERSION > 0'
      })).toStrictEqual(true)
    })

    it('enables condition on NODE_MAJOR_VERSION', () => {
      expect(executeIf({
        if: 'NODE_MAJOR_VERSION > 1000'
      })).toStrictEqual(false)
    })
  })

  describe('environment variables', () => {
    beforeAll(() => {
      process.env.ENV_VAR = 'value'
      process.env.NODE_MAJOR_VERSION = 'any'
    })

    it('gives access to environment variables', () => {
      expect(executeIf({
        if: 'ENV_VAR'
      })).toStrictEqual('value')
    })

    it('does not allow overridding of NODE_MAJOR_VERSION', () => {
      expect(executeIf({
        if: 'NODE_MAJOR_VERSION'
      })).not.toStrictEqual('any')
    })
  })
})
