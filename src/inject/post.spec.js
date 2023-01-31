class UI5Object {}
global.window = {
  sap: {
    ui: {
      base: {
        Object: UI5Object
      }
    }
  }
}

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
        [1, 2],
        { a: 'a' },
        { a: 'a', b: { b: 'b' } },
        [{ a: 'a' }, { a: 'a', b: { b: 'b' } }]
      ]

      simpleValues.forEach(simpleValue => {
        it(JSON.stringify(simpleValue), () => {
          expect(stringify(simpleValue)).toBe(JSON.stringify(simpleValue))
        })
      })
    })

    describe('UI5 objects', () => {
      it('reduces UI5 objects to their simplest form (no ID)', () => {
        const obj = new UI5Object()
        obj.getMetadata = () => ({
          getName: () => 'sap.m.Button'
        })
        expect(JSON.parse(stringify(obj))).toStrictEqual({
          'ui5:class': 'sap.m.Button'
        })
      })

      it('reduces UI5 objects to their simplest form (with ID)', () => {
        const obj = new UI5Object()
        obj.getId = () => 'test'
        obj.getMetadata = () => ({
          getName: () => 'sap.m.Button'
        })
        expect(JSON.parse(stringify(obj))).toStrictEqual({
          'ui5:id': 'test',
          'ui5:class': 'sap.m.Button'
        })
      })

      it('works on a complex object', () => {
        const obj = new UI5Object()
        obj.getId = () => 'test'
        obj.getMetadata = () => ({
          getName: () => 'sap.m.Button'
        })
        expect(JSON.parse(stringify({
          complex: obj
        }))).toStrictEqual({
          complex: {
            'ui5:id': 'test',
            'ui5:class': 'sap.m.Button'
          }
        })
      })
    })

    describe('circular references', () => {
      it('converts simple circular reference (object)', () => {
        const a = { a: 'a' }
        const b = { b: 'b' }
        a.b = b
        b.a = a
        expect(JSON.parse(stringify(a))).toStrictEqual({
          'circular:id': 0,
          a: 'a',
          b: {
            b: 'b',
            a: {
              'circular:ref': 0
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
        expect(JSON.parse(stringify(a))).toStrictEqual({
          'circular:id': 0,
          a: 'a',
          b: {
            'circular:id': 1,
            b: 'b',
            c: ['c', { 'circular:ref': 1 }],
            d: {
              d: 'd',
              a: {
                'circular:ref': 0
              }
            }
          }
        })
      })

      it('converts simple circular reference (array)', () => {
        const a = ['a']
        const b = ['b']
        a.push(b)
        b.push(a)
        expect(JSON.parse(stringify(a))).toStrictEqual({
          'circular:id': 0,
          'circular:array': [
            'a',
            [
              'b',
              { 'circular:ref': 0 }
            ]
          ]
        })
      })
    })
  })
})
