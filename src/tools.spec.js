const { noop } = require('./tools')

describe('src/tools', () => {
  describe('noop', () => {
    it('is an empty function', () => {
      expect(noop()).toBeUndefined()
      expect(() => noop()).not.toThrow()
    })
  })
})
