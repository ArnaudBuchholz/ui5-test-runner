interface SinonStub {
  (...arguments_: unknown[]): unknown;
  called: boolean;
  callCount: number;
  args: unknown[][];
  returnValues: unknown[];
  calledWith(...arguments_: unknown[]): boolean;
  callsFake(function_: (...arguments_: unknown[]) => unknown): SinonStub;
  returns(value: unknown): SinonStub;
  onCall(index: number): SinonStub;
  restore(): void;
}

interface SinonSandbox {
  stub(): SinonStub;
  stub(object: object, property: string): SinonStub;
  resetHistory(): void;
}

interface Sinon {
  createSandbox(): SinonSandbox;
}

export interface JestMock extends SinonStub {
  mockImplementation(function_: (...arguments_: unknown[]) => unknown): JestMock;
  mockImplementationOnce(function_: (...arguments_: unknown[]) => unknown): JestMock;
  mockReturnValue(value: unknown): JestMock;
  mockReturnValueOnce(value: unknown): JestMock;
  mockResolvedValue(value: unknown): JestMock;
  mockResolvedValueOnce(value: unknown): JestMock;
  mockRejectedValue(value: unknown): JestMock;
  mockRejectedValueOnce(value: unknown): JestMock;
  mockRestore(): void;
  readonly mock: { calls: unknown[][]; results: Array<{ value: unknown }> };
}

export interface Jest {
  fn(implementation?: (...arguments_: unknown[]) => unknown): JestMock;
  spyOn(object: object, property: string): JestMock;
  clearAllMocks(): void;
}

const JEST_MOCK = Symbol('jestMock');

const wrap = (stub: SinonStub): JestMock => {
  const mock = stub as JestMock;
  (mock as unknown as Record<symbol, boolean>)[JEST_MOCK] = true;
  Object.assign(mock, {
    mockImplementation(function_: (...arguments_: unknown[]) => unknown) {
      stub.callsFake(function_);
      return mock;
    },
    mockImplementationOnce(function_: (...arguments_: unknown[]) => unknown) {
      stub.onCall(0).callsFake(function_);
      return mock;
    },
    mockReturnValue(value: unknown) {
      stub.returns(value);
      return mock;
    },
    mockReturnValueOnce(value: unknown) {
      stub.onCall(0).returns(value);
      return mock;
    },
    mockResolvedValue(value: unknown) {
      stub.returns(Promise.resolve(value));
      return mock;
    },
    mockResolvedValueOnce(value: unknown) {
      stub.onCall(0).returns(Promise.resolve(value));
      return mock;
    },
    mockRejectedValue(value: unknown) {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- jest rejects with arbitrary values
      stub.callsFake(() => Promise.reject(value));
      return mock;
    },
    mockRejectedValueOnce(value: unknown) {
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- jest rejects with arbitrary values
      stub.onCall(0).callsFake(() => Promise.reject(value));
      return mock;
    },
    mockRestore() {
      stub.restore();
    }
  });
  Object.defineProperty(mock, 'mock', {
    get: () => ({
      calls: stub.args,
      results: stub.returnValues.map((value) => ({ value }))
    })
  });
  return mock;
};

export const createJest = (): Jest => {
  const sinon = (window as unknown as { sinon?: Sinon }).sinon;
  if (sinon?.createSandbox === undefined) {
    throw new Error('jest: sinon 4 is required on the test page');
  }
  const sandbox = sinon.createSandbox();
  return {
    fn(implementation) {
      const mock = wrap(sandbox.stub());
      if (implementation) {
        mock.mockImplementation(implementation);
      }
      return mock;
    },
    spyOn(object, property) {
      const original = (object as Record<string, unknown>)[property];
      if ((original as Record<symbol, boolean> | undefined)?.[JEST_MOCK]) {
        return original as JestMock;
      }
      const mock = wrap(sandbox.stub(object, property));
      mock.mockImplementation(original as (...arguments_: unknown[]) => unknown);
      return mock;
    },
    clearAllMocks() {
      sandbox.resetHistory();
    }
  };
};
