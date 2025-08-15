/**
 * Simple wrapper to transform jest tests to QUnit
 * 
 * Proxies are used to detect missing implementation.
 */

class Jest2QUnitError extends SyntaxError {
  static throw (reason) {
    throw new Jest2QUnitError(reason);
  }

  constructor (reason) {
    super('jest2qunit failure : ' + reason);
    this.name = 'Jest2QUnitError';
  }
}

const debug = (...args) => console.log('🐞', ...args);

let _sinonSandbox;
const jestSpy = (sinonStub) => new Proxy(Object.assign(sinonStub, {
  mockImplementation (callback) { sinonStub.callsFake(callback); },
  mockImplementationOnce (callback) { sinonStub.onCall(0).callsFake(callback); },
  mockResolvedValueOnce (value) { sinonStub.onCall(0).callsFake(() => Promise.resolve(value)); },
  mockReturnValue (value) { sinonStub.returns(value); },
}), {
  get(target, property) {
    return target[property] ?? Jest2QUnitError.throw(`jestSpy.${property} is missing`);
  }
});

const jest = new Proxy({
  fn () { return jestSpy(_sinonSandbox.stub()); },
  spyOn (object, property) { return jestSpy(_sinonSandbox.stub(object, property)); },
  clearAllMocks () { _sinonSandbox.resetHistory(); },
}, {
  get(target, property) {
    return target[property] ?? Jest2QUnitError.throw(`jest.${property} is missing`);
  }
});

const expect = (value) => {
  let not = false;
  const proxy = new Proxy({
    toHaveBeenCalled () { not ? QUnit.assert.ok(!value.called): QUnit.assert.ok(value.called); },
    toHaveBeenCalledTimes (n) { QUnit.assert.strictEqual(value.callCount, n); },
    toHaveBeenCalledWith (...args) { QUnit.assert.ok(value.calledWith(...args)); },
    toBe (expected) { QUnit.assert.equal(value, expected); },
    toBeDefined () { QUnit.assert.notStrictEqual(value, undefined); },
    toBeUndefined () { QUnit.assert.strictEqual(value, undefined); },
    toBeTruthy () { QUnit.assert.ok(!!value); },
    toBeFalsy (){ QUnit.assert.ok(!value); },
  }, {
    get(target, property) {
      if (property === 'not') {
        not = !not;
        return proxy;
      }
      return target[property] ?? Jest2QUnitError.throw(`expect.${property} is missing`);
    }
  });
  return proxy;
};

let _beforeEach;
const beforeEach = (callback) => {
  if (_beforeEach) {
    Jest2QUnitError.throw('Only a single beforeEach is supported');
  }
  debug('beforeEach()');
  _beforeEach = callback;
};

let _afterEach;
const afterEach = (callback) => {
  if (_afterEach) {
    Jest2QUnitError.throw('Only a single beforeEach is supported');
  }
  debug('afterEach()');
  _afterEach = callback;
};

let _its;
const it = (label, callback) => {
  if (!Array.isArray(_its)) {
    Jest2QUnitError.throw('it allowed only as part of a describe');
  }
  debug(`it("${label}")`);
  _its.push({ label, callback });
};

let _inDescribe = false;
const describe = (label, callback) => {
  QUnit.config.reorder = false; // By default in Jest
  if (typeof sinon !== 'object') {
    Jest2QUnitError.throw('sinon is missing');
  }
  if (_inDescribe) {
    Jest2QUnitError.throw('Nested describes is not supported');
  }
  _inDescribe = true;
  _beforeEach = undefined;
  _beforeEach = undefined;
  _its = [];
  debug(`describe("${label}")`);
  callback();
  _inDescribe = false;
  QUnit.module(label, (hooks) => {
    hooks.beforeEach(() => {
      debug(`Creating sinon sandbox`);
      _sinonSandbox = sinon.createSandbox();
      if (_beforeEach) {
        _beforeEach();
      }
    });
    hooks.afterEach(() => {
      if (_afterEach) {
        _afterEach();
      }
      debug(`Restoring sinon sandbox`);
      _sinonSandbox.restore();
      _sinonSandbox = undefined;
    });
    _its.forEach(({ label, callback }) => {
      QUnit.test(label, callback);
    });
  });
};
