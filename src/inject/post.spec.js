global.window = {}
require('./post')

describe('src/inject/post', () => {
  describe('stringify', () => {
    const stringify = window['ui5-test-runner/stringify']

    describe('simple values', () => {
      const simpleValues = [
        null,
        '',
        'Hello World !',
        0,
        1,
        false,
        true,
        [],
        [1, 2]
      ]

      simpleValues.forEach(simpleValue => {
        it(JSON.stringify(simpleValue), () => {
          expect(stringify(simpleValue)).toBe(JSON.stringify(simpleValue))
        })
      })
    })

    describe('circular references', () => {
      it('converts simple circular reference', () => {
        const a = { a: 'a' }
        const b = { b: 'b' }
        a.b = b
        b.a = a
        const stringified = stringify(a)
        let simplified
        try {
          simplified = JSON.parse(stringified)
        } catch (e) {
          expect(stringified).toBe('')
        }
        expect(simplified).toStrictEqual({
          __circular_id__: 0,
          a: 'a',
          b: {
            b: 'b',
            a: {
              __circular_ref__: 0
            }
          }
        })
      })

      it('converts deep circular reference', () => {
        const a = {
          a: 'a',
          b: {
            b: 'b',
            c: ['c'],
            d: {
              d: 'd'
            }
          }
        }
        a.b.c.push(a.b)
        a.b.d.a = a
        const stringified = stringify(a)
        let simplified
        try {
          simplified = JSON.parse(stringified)
        } catch (e) {
          expect(stringified).toBe('')
        }
        expect(simplified).toStrictEqual({
          __circular_id__: 0,
          a: 'a',
          b: {
            __circular_id__: 1,
            b: 'b',
            c: ['c', { __circular_ref__: 1 }],
            d: {
              d: 'd',
              a: {
                __circular_ref__: 0
              }
            }
          }
        })
      })
    })
  })
})
