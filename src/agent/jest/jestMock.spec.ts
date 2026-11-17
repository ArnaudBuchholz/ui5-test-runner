import { it, expect, describe, beforeEach, afterEach, vi } from 'vitest';
import { createJest } from './jestMock.js';

interface FakeStub {
  (...arguments_: unknown[]): unknown;
  called: boolean;
  callCount: number;
  args: unknown[][];
  returnValues: unknown[];
  calledWith: (...arguments_: unknown[]) => boolean;
  callsFake: (function_: (...arguments_: unknown[]) => unknown) => FakeStub;
  returns: (value: unknown) => FakeStub;
  onCall: (index: number) => FakeStub;
  restore: () => void;
}

const createFakeStub = (): FakeStub => {
  let fake: ((...arguments_: unknown[]) => unknown) | undefined;
  const onCallFakes: Array<(...arguments_: unknown[]) => unknown> = [];
  const stub = ((...arguments_: unknown[]) => {
    stub.called = true;
    const call = stub.callCount;
    ++stub.callCount;
    stub.args.push(arguments_);
    const implementation = onCallFakes[call] ?? fake;
    const value = implementation ? implementation(...arguments_) : undefined;
    stub.returnValues.push(value);
    return value;
  }) as FakeStub;
  Object.assign(stub, {
    called: false,
    callCount: 0,
    args: [] as unknown[][],
    returnValues: [] as unknown[],
    calledWith: (...expected: unknown[]) =>
      stub.args.some((callArguments) => JSON.stringify(callArguments) === JSON.stringify(expected)),
    callsFake: (function_: (...arguments_: unknown[]) => unknown) => {
      fake = function_;
      return stub;
    },
    returns: (value: unknown) => stub.callsFake(() => value),
    onCall: (index: number) => ({
      callsFake: (function_: (...arguments_: unknown[]) => unknown) => {
        onCallFakes[index] = function_;
        return stub;
      },
      returns: (value: unknown) => {
        onCallFakes[index] = () => value;
        return stub;
      }
    }),
    restore: vi.fn()
  });
  return stub;
};

const fakeSinon = {
  createSandbox: () => ({
    stub: (object?: Record<string, unknown>, property?: string) => {
      const stub = createFakeStub();
      if (object && property) {
        object[property] = stub;
      }
      return stub;
    },
    resetHistory: vi.fn()
  })
};

beforeEach(() => {
  (window as unknown as { sinon: unknown }).sinon = fakeSinon;
});

afterEach(() => {
  delete (window as unknown as { sinon?: unknown }).sinon;
});

describe('when sinon is missing', () => {
  it('throws a helpful error', () => {
    delete (window as unknown as { sinon?: unknown }).sinon;
    expect(() => createJest()).toThrow(/sinon 4 is required/);
  });
});

describe('jest.fn', () => {
  it('records calls and arguments', () => {
    const mock = createJest().fn();
    mock(1, 2);
    expect(mock.callCount).toBe(1);
    expect(mock.mock.calls[0]).toStrictEqual([1, 2]);
  });

  it('applies an initial implementation', () => {
    const mock = createJest().fn((x) => (x as number) + 1);
    expect(mock(41)).toBe(42);
  });

  it('exposes results through the mock accessor', () => {
    const mock = createJest().fn(() => 7);
    mock();
    expect(mock.mock.results[0]).toStrictEqual({ value: 7 });
  });
});

describe('mock value helpers', () => {
  it('mockReturnValue sets a constant return', () => {
    const mock = createJest().fn();
    mock.mockReturnValue('x');
    expect(mock()).toBe('x');
  });

  it('mockReturnValueOnce overrides only the first call', () => {
    const mock = createJest().fn();
    mock.mockReturnValue('default').mockReturnValueOnce('once');
    expect(mock()).toBe('once');
    expect(mock()).toBe('default');
  });

  it('mockResolvedValue resolves to the value', async () => {
    const mock = createJest().fn();
    mock.mockResolvedValue(5);
    await expect(mock()).resolves.toBe(5);
  });

  it('mockResolvedValueOnce overrides only the first resolution', async () => {
    const mock = createJest().fn();
    mock.mockResolvedValue(0).mockResolvedValueOnce(1);
    await expect(mock()).resolves.toBe(1);
    await expect(mock()).resolves.toBe(0);
  });

  it('mockRejectedValue rejects with the value', async () => {
    const mock = createJest().fn();
    mock.mockRejectedValue('boom');
    await expect(mock()).rejects.toBe('boom');
  });

  it('mockRejectedValueOnce overrides only the first rejection', async () => {
    const mock = createJest().fn();
    mock.mockRejectedValue(0).mockRejectedValueOnce(1);
    await expect(mock()).rejects.toBe(1);
    await expect(mock()).rejects.toBe(0);
  });

  it('mockImplementation sets the implementation', () => {
    const mock = createJest().fn();
    mock.mockImplementation(() => 'implemented');
    expect(mock()).toBe('implemented');
  });

  it('mockImplementationOnce overrides only the first call', () => {
    const mock = createJest().fn();
    mock.mockImplementation(() => 'default').mockImplementationOnce(() => 'once');
    expect(mock()).toBe('once');
    expect(mock()).toBe('default');
  });

  it('mockRestore restores the underlying stub', () => {
    const mock = createJest().fn();
    expect(() => mock.mockRestore()).not.toThrow();
  });
});

describe('jest.spyOn', () => {
  it('wraps a method while preserving its implementation', () => {
    const object = { add: (a: number, b: number) => a + b };
    const spy = createJest().spyOn(object, 'add');
    expect(spy(2, 3)).toBe(5);
    expect(spy.called).toBe(true);
  });

  it('returns the existing spy when the method is already spied', () => {
    const object = { add: (a: number, b: number) => a + b };
    const jestApi = createJest();
    const first = jestApi.spyOn(object, 'add');
    const second = jestApi.spyOn(object, 'add');
    expect(second).toBe(first);
  });
});

describe('jest.clearAllMocks', () => {
  it('resets the sandbox history', () => {
    const resetHistory = vi.fn();
    (window as unknown as { sinon: unknown }).sinon = {
      createSandbox: () => ({ stub: () => createFakeStub(), resetHistory })
    };
    createJest().clearAllMocks();
    expect(resetHistory).toHaveBeenCalled();
  });
});
