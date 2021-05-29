const { getPageTimeout, globallyTimedOut } = require('../../src/timeout')

describe('src/timeout', () => {
  describe('getPageTimeout', () => {
    it('returns 0 when no timeout is defined', () => {
      expect(getPageTimeout({})).toStrictEqual(0)
    })

    it('returns pageTimeout when no globalTimeout is defined', () => {
      expect(getPageTimeout({ pageTimeout: 123 })).toStrictEqual(123)
    })

    it('returns pageTimeout if smaller than globalTimeout', () => {
      expect(getPageTimeout({ pageTimeout: 123, globalTimeout: 1000, start: new Date() })).toStrictEqual(123)
    })

    it('returns reminder of the globalTimeout', () => {
      expect(getPageTimeout({ globalTimeout: 10, start: new Date() })).not.toStrictEqual(0)
    })

    it('returns reminder of the globalTimeout if smaller than pageTimeout', () => {
      expect(getPageTimeout({ pageTimeout: 123, globalTimeout: 10, start: new Date() })).not.toStrictEqual(123)
    })
  })

  describe('globallyTimedOut', () => {
    it('returns false if no globalTimeout', () => {
      expect(globallyTimedOut({})).toStrictEqual(false)
    })

    it('returns false if not globally timed out', () => {
      expect(globallyTimedOut({ globalTimeout: 1000, start: new Date() })).toStrictEqual(false)
    })

    it('returns true if globally timed out', () => {
      expect(globallyTimedOut({ globalTimeout: 10, start: new Date(Date.now() - 1000) })).toStrictEqual(true)
    })
  })
})
