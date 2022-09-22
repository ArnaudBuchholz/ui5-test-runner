const { noop, pad } = require('./tools')

describe('src/tools', () => {
  describe('noop', () => {
    it('is an empty function', () => {
      expect(noop()).toBeUndefined()
      expect(() => noop()).not.toThrow()
    })
  })

  describe('pad', () => {
    it('works if no operator is given', () => {
      expect(pad(20)`abc`).toStrictEqual('abc')
    })

    it('fails if several operators are given', () => {
      expect(() => pad()`${pad.x('-')}${pad.x('+')}`).toThrow()
    })

    it('extends a string (begin)', () => {
      expect(pad(20)`${pad.x('-')}12`).toStrictEqual('------------------12')
    })

    it('extends a string (middle)', () => {
      expect(pad(20)`1${pad.x('-')}2`).toStrictEqual('1------------------2')
    })

    it('extends a string (end)', () => {
      expect(pad(20)`12${pad.x('-')}`).toStrictEqual('12------------------')
    })

    it('extends a string (multiple chars)', () => {
      expect(pad(20)`1${pad.x('-+')}2`).toStrictEqual('1-+-+-+-+-+-+-+-+-+2')
    })

    it('left trims a string', () => {
      expect(pad(20)`+${pad.lt('abcdefghijklmnopqrstuvwxyz')}+`).toStrictEqual('+...lmnopqrstuvwxyz+')
    })

    it('left trims a small string', () => {
      expect(pad(20)`+${pad.lt('abcdef')}+`).toStrictEqual('+abcdef            +')
    })
  })
})
