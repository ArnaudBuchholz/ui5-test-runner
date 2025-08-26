/* global sinon */
(() => {
  class Jest2QUnitError extends SyntaxError {
    static throw (reason) {
      throw new Jest2QUnitError(reason)
    }

    constructor (reason) {
      super('jest2qunit failure : ' + reason)
      this.name = 'Jest2QUnitError'
    }
  }

  const debug = (...args) => console.log('🐞', ...args)

  const $raw = Symbol('raw')
  const unproxify = (value) => value && (value[$raw] ?? value)

  const get = function (target, property) {
    if (target[property] !== undefined) {
      return target[property]
    }
    if (typeof property === 'symbol') {
      return undefined // otherwise returned previously
    }
    if (typeof this[property] === 'function') {
      return this[property](target)
    }
    Jest2QUnitError.throw(`${this._type}.${property} is missing`)
  }

  let _sinonSandbox
  const jestSpy = (sinonStub) => new Proxy(Object.assign(sinonStub, {
    [$raw]: sinonStub,
    mockImplementation (callback) { sinonStub.callsFake(callback); return this },
    mockImplementationOnce (callback) { sinonStub.onCall(0).callsFake(callback); return this },
    mockResolvedValue (value) { sinonStub.returns(Promise.resolve(value)); return this },
    mockResolvedValueOnce (value) { sinonStub.onCall(0).returns(Promise.resolve(value)); return this },
    mockRejectedValue (value) { sinonStub.returns(Promise.reject(value)); return this },
    mockRejectedValueOnce (value) { sinonStub.onCall(0).returns(Promise.reject(value)); return this },
    mockReturnValue (value) { sinonStub.returns(value); return this },
    mockReturnValueOnce (value) { sinonStub.onCall(0).returns(value); return this },
    mockRestore () { sinonStub.restore() },
    get mock () {
      return new Proxy({}, {
        _type: 'jestSpy.mock',
        get,
        calls () { return sinonStub.args },
        results () { return sinonStub.returnValues.map(value => ({ value })) }
      })
    }
  }), { _type: 'jestSpy', get })

  const jest = new Proxy({
    fn (impl) {
      const stub = jestSpy(_sinonSandbox.stub())
      if (impl) {
        stub.mockImplementation(impl)
      }
      return stub
    },
    spyOn (object, property) {
      const impl = object[property]
      if (impl[$raw]) { // already looks like a spy
        return impl
      }
      const spy = jestSpy(_sinonSandbox.stub(object, property))
      spy.mockImplementation(impl)
      return spy
    },
    clearAllMocks () { _sinonSandbox.resetHistory() }
  }, { _type: 'jest', get })

  const stringify = value => value === undefined
    ? 'undefined'
    : typeof value === 'function'
      ? Function.prototype.toString.call(value)
      : value && value instanceof RegExp
        ? value.toString()
        : JSON.stringify(value)

  const negate = method => method.startsWith('not')
    ? method.charAt(4).toLowerCase() + method.substring(5)
    : 'not' + method.charAt(0).toUpperCase() + method.substring(1)

  const expectQUnit = params => {
    let { not, operator, method = 'ok', value, expected, callback } = params
    if (expected) {
      expected = unproxify(expected)
    }
    if (not) {
      method = negate(method)
    }
    const message = `expect(result)${not ? '.not' : ''}.${operator}${!operator.includes('(') ? '(' + stringify(expected) + ')' : ''}`
    const parameters = []
    if ('expected' in params && !['ok', 'notOk'].includes(method)) {
      parameters.push(expected)
    }
    parameters.push(message)
    return value && value.then
      ? value.then(resolvedValue => QUnit.assert[method](callback ? callback(resolvedValue) : resolvedValue, ...parameters))
      : QUnit.assert[method](callback ? callback(value) : value, ...parameters)
  }

  const expect = (value) => {
    value = unproxify(value)
    let not = false
    const proxy = new Proxy({
      toBe: (expected) => expectQUnit({ not, operator: 'toBe', method: 'equal', value, expected }),
      toBeDefined: () => expectQUnit({ not, operator: 'toBeDefined()', method: 'notStrictEqual', value, expected: undefined }),
      toBeUndefined: () => expectQUnit({ not, operator: 'toBeUndefined()', method: 'strictEqual', value, expected: undefined }),
      toBeNull: () => expectQUnit({ not, operator: 'toBeNull()', method: 'strictEqual', value, expected: null }),
      toBeNaN: () => expectQUnit({ not, operator: 'toBeNaN()', value, callback: value => isNaN(value) }),
      toBeTruthy: () => expectQUnit({ not, operator: 'toBeTruthy()', value }),
      toBeFalsy: () => expectQUnit({ not, operator: 'toBeFalsy()', value, callback: value => !value }),
      toEqual: (expected) => expectQUnit({ not, operator: 'toEqual', method: 'deepEqual', value, expected }),
      toStrictEqual: (expected) => expectQUnit({ not, operator: 'toStrictEqual', method: 'deepEqual', value, expected }),
      toBeGreaterThan: (expected) => expectQUnit({ not, operator: 'toBeGreaterThan', value, callback: value => value > expected, expected }),
      toBeGreaterThanOrEqual: (expected) => expectQUnit({ not, operator: 'toBeGreaterThanOrEqual', value, callback: value => value >= expected, expected }),
      toBeLessThan: (expected) => expectQUnit({ not, operator: 'toBeLessThan', value, callback: value => value < expected, expected }),
      toBeLessThanOrEqual: (expected) => expectQUnit({ not, operator: 'toBeLessThanOrEqual', value, callback: value => value <= expected, expected }),
      toMatch: (expected) => expectQUnit({ not, operator: 'toMatch', value, callback: value => expected.test(value), expected }),
      toContain: (expected) => expectQUnit({ not, operator: 'toContain', value, callback: value => value.includes(expected), expected }),
      // TODO: handle
      toThrow: (expected) => expectQUnit({
        not,
        operator: 'toThrow',
        value,
        callback: value => {
          try {
            value()
            return false
          } catch (e) {
            if (typeof expected === 'string') {
              return e.message === expected
            }
            if (expected instanceof RegExp) {
              return expected.test(e.message)
            }
            return true
          }
        },
        expected: typeof expected === 'function' ? expected.name : expected
      }),
      toBeCloseTo: (expected, numDigits = 2) => {
        const factor = 10 ** numDigits
        const round = (x) => Math.floor(x * factor) / factor
        return expectQUnit({ not, operator: 'toBeCloseTo', method: 'strictEqual', value: round(value), expected: round(expected) })
      },
      // Not async
      toHaveBeenCalled: () => expectQUnit({ not, operator: 'toHaveBeenCalled()', value, callback: value => value.called }),
      toHaveBeenCalledTimes: (n) => expectQUnit({ not, operator: 'toHaveBeenCalledTimes', method: 'strictEqual', value, callback: value => value.callCount, expected: n }),
      toHaveBeenCalledWith: (...args) => expectQUnit({ not, operator: `toHaveBeenCalledWith(${args.map(stringify).join(', ')})`, value, callback: value => value.calledWith(...args) })
    }, {
      _type: 'expect',
      get,
      not () {
        not = !not
        return proxy
      },
      resolves () {
        if (not) {
          Jest2QUnitError.throw('expect.resolves cannot be negated')
        }
        if (typeof value.then !== 'function') {
          Jest2QUnitError.throw('expected value must be thenable')
        }
        return expect(value.then(value => value, reason => QUnit.assert.ok(false, reason)))
      },
      rejects () {
        if (not) {
          Jest2QUnitError.throw('expect.resolves cannot be negated')
        }
        if (typeof value.then !== 'function') {
          Jest2QUnitError.throw('expected value must be thenable')
        }
        return expect(value.then(() => QUnit.assert.ok(false, 'Promise should not be fulfilled'), reason => reason))
      }
    })
    return proxy
  }

  const rootDescribe = {}
  let currentDescribe = rootDescribe

  const bddApi = (type, data) => {
    const { label } = data
    debug(`${type}(${label ? '"' + label + '"' : ''})`)
    if (!currentDescribe[type]) {
      currentDescribe[type] = []
    }
    currentDescribe[type].push(data)
  }

  const beforeAll = (callback) => bddApi('beforeAll', callback)
  const before = (callback) => bddApi('beforeAll', callback)
  const beforeEach = (callback) => bddApi('beforeEach', callback)
  const afterEach = (callback) => bddApi('afterEach', callback)
  const afterAll = (callback) => bddApi('afterAll', callback)
  const after = (callback) => bddApi('afterAll', callback)
  const it = (label, callback) => bddApi('it', { label, callback })
  it.only = (label, callback) => bddApi('it', { label, callback, only: true })
  it.skip = (label, callback) => bddApi('it', { label, callback, skip: true })
  it.todo = (label, callback) => bddApi('it', { label, callback, todo: true })
  const test = (label, callback) => bddApi('it', { label, callback })
  test.only = (label, callback) => bddApi('it', { label, callback, only: true })
  test.skip = (label, callback) => bddApi('it', { label, callback, skip: true })
  test.todo = (label, callback) => bddApi('it', { label, callback, todo: true })

  const $alreadyConvertedToQUnit = Symbol('alreadyConvertedToQUnit')
  const toQUnit = (describe) => {
    if (describe[$alreadyConvertedToQUnit]) {
      return
    }
    describe[$alreadyConvertedToQUnit] = true
    QUnit.module(describe.label ?? '(root)', function (hooks) {
      if (describe.beforeAll) {
        hooks.before(async () => Promise.all(describe.beforeAll.map(callback => callback())))
      }
      if (describe.beforeEach) {
        hooks.beforeEach(async () => Promise.all(describe.beforeEach.map(callback => callback())))
      }
      if (describe.afterEach) {
        hooks.afterEach(async () => Promise.all(describe.afterEach.map(callback => callback())))
      }
      if (describe.afterAll) {
        hooks.after(async () => Promise.all(describe.afterAll.map(callback => callback())))
      }
      if (describe.it) {
        for (const { label, callback, skip, todo, only } of describe.it) {
          if (todo) {
            QUnit.test('[todo] ' + label, (assert) => assert.expect(0))
          } else if (skip) {
            QUnit.test('[skip] ' + label, (assert) => assert.expect(0))
          } else if (only) {
            QUnit.only(label, callback)
          } else {
            QUnit.test(label, callback)
          }
        }
      }
      if (describe.describe) {
        for (const subDescribe of describe.describe) {
          toQUnit(subDescribe)
        }
      }
    })
  }

  const describe = (label, callback) => {
    QUnit.config.reorder = false // By default in Jest
    if (typeof sinon !== 'object') {
      Jest2QUnitError.throw('sinon is missing')
    }
    if (sinon.createSandbox === undefined) {
      Jest2QUnitError.throw('sinon 4 is expected')
    }
    _sinonSandbox = sinon.createSandbox()

    const parentDescribe = currentDescribe
    if (!parentDescribe.describe) {
      parentDescribe.describe = []
    }
    currentDescribe = {
      label
    }
    parentDescribe.describe.push(currentDescribe)

    debug(`describe("${label}")`)
    callback()

    currentDescribe = parentDescribe
    if (currentDescribe === rootDescribe) {
      rootDescribe[$alreadyConvertedToQUnit] = false
      toQUnit(rootDescribe)
    }
  }

  Object.assign(globalThis, {
    jest,
    expect,
    beforeAll,
    before,
    beforeEach,
    afterEach,
    afterAll,
    after,
    it,
    test,
    describe
  })
})()
