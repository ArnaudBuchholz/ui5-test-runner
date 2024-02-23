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
global.location = '/test.html'

function XMLHttpRequest () {
  this._headers = {}
  XMLHttpRequest.onNewInstance(this)
}

XMLHttpRequest.prototype = {
  addEventListener (name, callback) {
    if (name === 'load') {
      this._load = callback
    } else if (name === 'error') {
      this._error = callback
    }
  },

  open (method, url) {
    this._method = method
    this._url = url
  },

  setRequestHeader (name, value) {
    this._headers[name] = value
  },

  send (body) {
    this._body = body
  },

  complete (success, statusText, text) {
    this.statusText = statusText
    this.responseText = text
    if (success) {
      this._load(this)
    } else {
      this._error(this)
    }
  }
}

global.XMLHttpRequest = XMLHttpRequest

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

      it('works on incomplete mocked objects', () => {
        const obj = new UI5Object()
        expect(JSON.parse(stringify({
          complex: obj
        }))).toStrictEqual({
          complex: {
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

  describe('post', () => {
    const post = window['ui5-test-runner/post']

    it('sends data to the proper endpoint', async () => {
      XMLHttpRequest.onNewInstance = xhr => {
        xhr.send = body => {
          expect(xhr).toMatchObject({
            _method: 'POST',
            _url: '/_/test',
            _headers: {
              'x-page-url': '/test.html'
            }
          })
          expect(body).toStrictEqual('"Hello World !"')
          expect(typeof xhr._load).toStrictEqual('function')
          expect(typeof xhr._error).toStrictEqual('function')
          xhr.complete(true, 'OK', 'OK')
        }
      }
      await post('test', 'Hello World !')
    })

    it.skip('sequences the request', async () => {
      let count = 0
      XMLHttpRequest.onNewInstance = xhr => {
        ++count
        xhr.send = body => {
          if (xhr._url === '/_/test1') {
            expect(count === 1)
            xhr.complete(true, 'OK', 'OK')
          } else {
            xhr.complete(true, 'OK', 'OK')
          }
        }
      }
      post('test1', 'value1')
      await post('test2', 'value2')
    })

    it.skip('does not cascade failures')
  })
})
