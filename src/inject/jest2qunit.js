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

  let _sinonSandbox
  const jestSpy = (sinonStub, impl) => new Proxy(Object.assign(sinonStub, {
    mockImplementation (callback) { sinonStub.callsFake(callback) },
    mockImplementationOnce (callback) { sinonStub.onCall(0).callsFake(callback) },
    mockResolvedValueOnce (value) { sinonStub.onCall(0).callsFake(() => Promise.resolve(value)) },
    mockReturnValue (value) { sinonStub.returns(value) },
    mockRestore () { sinonStub.restore() },
    get mock () {
      return new Proxy({}, {
        get (target, property) {
          if (property === 'calls') { return sinonStub.args }
          if (property === 'results') { return sinonStub.returnValues.map(value => ({ value })) }
          Jest2QUnitError.throw(`jestSpy.mock.${property} is missing`)
        }
      })
    }
  }), {
    get (target, property) {
      return target[property] ?? Jest2QUnitError.throw(`jestSpy.${property} is missing`)
    }
  })

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
      const spy = jestSpy(_sinonSandbox.stub(object, property), impl)
      spy.mockImplementation(impl)
      return spy
    },
    clearAllMocks () { _sinonSandbox.resetHistory() }
  }, {
    get (target, property) {
      return target[property] ?? Jest2QUnitError.throw(`jest.${property} is missing`)
    }
  })

  const expect = (value) => {
    let not = false
    const proxy = new Proxy({
      toBe (expected) { not ? QUnit.assert.notEqual(value, expected) : QUnit.assert.equal(value, expected) },
      toBeDefined () { QUnit.assert.notStrictEqual(value, undefined) },
      toBeUndefined () { QUnit.assert.strictEqual(value, undefined) },
      toBeNull () { QUnit.assert.strictEqual(value, null) },
      toBeNaN () { QUnit.assert.ok(isNaN(value)) },
      toBeTruthy () { QUnit.assert.ok(!!value) },
      toBeFalsy () { QUnit.assert.ok(!value) },
      toEqual (expected) { not ? QUnit.assert.notDeepEqual(value, expected) : QUnit.assert.deepEqual(value, expected) },
      toBeGreaterThan (expected) { QUnit.assert.ok(value > expected) },
      toBeGreaterThanOrEqual (expected) { QUnit.assert.ok(value >= expected) },
      toBeLessThan (expected) { QUnit.assert.ok(value < expected) },
      toBeLessThanOrEqual (expected) { QUnit.assert.ok(value <= expected) },
      toMatch (expected) { QUnit.assert.ok(expected.test(value)) },
      toContain (expected) { QUnit.assert.ok(value.includes(expected)) },
      toThrow (expected) { QUnit.assert.throws(value, expected) },
      toBeCloseTo (expected, numDigits = 2) {
        const factor = 10 ** numDigits
        const round = (x) => Math.floor(x * factor) / factor
        QUnit.assert.strictEqual(round(value), round(expected))
      },
      toHaveBeenCalled () { not ? QUnit.assert.ok(!value.called) : QUnit.assert.ok(value.called) },
      toHaveBeenCalledTimes (n) { QUnit.assert.strictEqual(value.callCount, n) },
      toHaveBeenCalledWith (...args) { QUnit.assert.ok(value.calledWith(...args)) }
    }, {
      get (target, property) {
        if (property === 'not') {
          not = !not
          return proxy
        }
        return target[property] ?? Jest2QUnitError.throw(`expect.${property} is missing`)
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
  const beforeEach = (callback) => bddApi('beforeEach', callback)
  const afterEach = (callback) => bddApi('afterEach', callback)
  const afterAll = (callback) => bddApi('afterAll', callback)
  const it = (label, callback) => bddApi('it', { label, callback })
  it.skip = (label, callback) => bddApi('it', { label, callback, skip: true })
  it.todo = (label, callback) => bddApi('it', { label, callback, todo: true })
  const test = (label, callback) => bddApi('it', { label, callback })
  test.skip = (label, callback) => bddApi('it', { label, callback, skip: true })
  test.todo = (label, callback) => bddApi('it', { label, callback, todo: true })

  const toQUnit = (describe) => {
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
        for (const { label, callback, skip, todo } of describe.it) {
          if (todo) {
            QUnit.test('[todo] ' + label, (assert) => assert.expect(0))
          } else if (skip) {
            QUnit.test('[skip] ' + label, (assert) => assert.expect(0))
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
      afterAll(() => {
        _sinonSandbox.restore()
        _sinonSandbox = undefined
      })
      toQUnit(rootDescribe)
    }
  }

  Object.assign(globalThis, {
    jest,
    expect,
    beforeAll,
    beforeEach,
    afterEach,
    afterAll,
    it,
    test,
    describe
  })
})()
