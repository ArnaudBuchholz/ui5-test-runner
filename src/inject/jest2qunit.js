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
    ? method.charAt(3).toLowerCase() + method.substring(4)
    : 'not' + method.charAt(0).toUpperCase() + method.substring(1)

  const expectQUnit = params => {
    let { label = 'expect(result)', not, method, assert = 'ok', value, compute, expected, expectedLabel = stringify(expected) } = params
    if (expected) {
      expected = unproxify(expected)
    }
    if (not) {
      assert = negate(assert)
    }
    const message = `${label}${not ? '.not' : ''}.${method}${!method.includes('(') ? '(' + expectedLabel + ')' : ''}`
    const parameters = []
    if ('expected' in params && !['ok', 'notOk'].includes(assert)) {
      parameters.push(expected)
    }
    parameters.push(message)
    return value && value.then
      ? value.then(resolvedValue => QUnit.assert[assert](compute ? compute(resolvedValue) : resolvedValue, ...parameters))
      : QUnit.assert[assert](compute ? compute(value) : value, ...parameters)
  }

  const expect = (value, label) => {
    value = unproxify(value)
    let not = false
    const proxy = new Proxy({
      toBe: (expected) => expectQUnit({ label, not, method: 'toBe', assert: 'equal', value, expected }),
      toBeDefined: () => expectQUnit({ label, not, method: 'toBeDefined()', assert: 'notStrictEqual', value, expected: undefined }),
      toBeUndefined: () => expectQUnit({ label, not, method: 'toBeUndefined()', assert: 'strictEqual', value, expected: undefined }),
      toBeNull: () => expectQUnit({ label, not, method: 'toBeNull()', assert: 'strictEqual', value, expected: null }),
      toBeNaN: () => expectQUnit({ label, not, method: 'toBeNaN()', value, compute: value => isNaN(value) }),
      toBeTruthy: () => expectQUnit({ label, not, method: 'toBeTruthy()', value }),
      toBeFalsy: () => expectQUnit({ label, not, method: 'toBeFalsy()', value, compute: value => !value }),
      toEqual: (expected) => expectQUnit({ label, not, method: 'toEqual', assert: 'deepEqual', value, expected }),
      toStrictEqual: (expected) => expectQUnit({ label, not, method: 'toStrictEqual', assert: 'deepEqual', value, expected }),
      toBeGreaterThan: (expected) => expectQUnit({ label, not, method: 'toBeGreaterThan', value, compute: value => value > expected, expected }),
      toBeGreaterThanOrEqual: (expected) => expectQUnit({ label, not, method: 'toBeGreaterThanOrEqual', value, compute: value => value >= expected, expected }),
      toBeLessThan: (expected) => expectQUnit({ label, not, method: 'toBeLessThan', value, compute: value => value < expected, expected }),
      toBeLessThanOrEqual: (expected) => expectQUnit({ label, not, method: 'toBeLessThanOrEqual', value, compute: value => value <= expected, expected }),
      toMatch: (expected) => expectQUnit({ label, not, method: 'toMatch', value, compute: value => expected.test(value), expected }),
      toContain: (expected) => expectQUnit({ label, not, method: 'toContain', value, compute: value => value.includes(expected), expected }),
      // TODO: handle
      toThrow: (expected) => expectQUnit({
        label,
        not,
        method: 'toThrow',
        value,
        compute: value => {
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
        expected,
        expectedLabel: typeof expected === 'function' && expected.name ? expected.name : undefined
      }),
      toBeCloseTo: (expected, numDigits = 2) => {
        const factor = 10 ** numDigits
        const round = (x) => Math.floor(x * factor) / factor
        return expectQUnit({ label, not, method: 'toBeCloseTo', assert: 'strictEqual', value: round(value), expected: round(expected) })
      },
      // Not async
      toHaveBeenCalled: () => expectQUnit({ label, not, method: 'toHaveBeenCalled()', value, compute: value => value.called }),
      toHaveBeenCalledTimes: (n) => expectQUnit({ label, not, method: 'toHaveBeenCalledTimes', assert: 'strictEqual', value, compute: value => value.callCount, expected: n }),
      toHaveBeenCalledWith: (...args) => expectQUnit({ label, not, method: `toHaveBeenCalledWith(${args.map(stringify).join(', ')})`, value, compute: value => value.calledWith(...args) })
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
        return expect(value.then(value => value, reason => QUnit.assert.ok(false, reason)), 'expect(result).resolves')
      },
      rejects () {
        if (not) {
          Jest2QUnitError.throw('expect.resolves cannot be negated')
        }
        if (typeof value.then !== 'function') {
          Jest2QUnitError.throw('expected value must be thenable')
        }
        return expect(value.then(() => QUnit.assert.ok(false, 'Promise should not be fulfilled'), reason => reason), 'expect(result).rejects')
      }
    })
    return proxy
  }

  const rootDescribe = {}
  let currentDescribe = rootDescribe

  const bddApi = (type, data) => {
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
