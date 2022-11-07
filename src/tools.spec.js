const { filename, noop, pad } = require('./tools')

describe('src/tools', () => {
  describe('filename', () => {
    const baseUrl = 'http://localhost:8085/test.html'

    it('generates unique IDs for different search param', () => {
      const id1 = filename(baseUrl + '?param1')
      const id2 = filename(baseUrl + '?param2')
      expect(id1).not.toBe(id2)
    })

    it('generates similar IDs for different hashes', () => {
      const id1 = filename(baseUrl + '#param1')
      const id2 = filename(baseUrl + '#param2')
      expect(id1).toBe(id2)
    })
  })

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

    it('extends a string (multiple interpolation)', () => {
      expect(pad(20)`1${'3'}${pad.x('-')}${'4'}2`).toStrictEqual('13----------------42')
    })

    it('extends a string (end)', () => {
      expect(pad(20)`12${pad.x('-')}`).toStrictEqual('12------------------')
    })

    it('extends a string (multiple chars)', () => {
      expect(pad(20)`1${pad.x('-+')}2`).toStrictEqual('1-+-+-+-+-+-+-+-+-+2')
    })

    it('left trims a string', () => {
      expect(pad(20)`1${pad.lt('abcdefghijklmnopqrstuvwxyz')}2`).toStrictEqual('1...lmnopqrstuvwxyz2')
    })

    it('left trims a small string', () => {
      expect(pad(20)`1${pad.lt('abcdef')}2`).toStrictEqual('1abcdef            2')
    })

    it('wraps text (small enough)', () => {
      expect(pad(20)`1${pad.w('abcdef')}2`).toStrictEqual('1abcdef            2')
    })

    it('wraps multiline', () => {
      expect(pad(20)`1${pad.w('a\nb')}2`)
        .toStrictEqual(`1a                 2
1b                 2`)
    })

    it('wraps multiline / long text', () => {
      expect(pad(20)`1${pad.w('first line\nsecond longer line to wrap\nfits exactly width')}2`)
        .toStrictEqual(`1first line        2
1second longer lin↵2
1e to wrap         2
1fits exactly width2`)
    })

    it('wraps multiline / long text (DOS carriage return)', () => {
      expect(pad(20)`1${pad.w('first line\r\nsecond longer line to wrap\r\nfits exactly width')}2`)
        .toStrictEqual(`1first line        2
1second longer lin↵2
1e to wrap         2
1fits exactly width2`)
    })
  })
})
