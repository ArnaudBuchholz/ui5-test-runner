import { it, expect, describe, beforeEach, afterEach, vi } from 'vitest';
import { UI5_TEST_RUNNER } from '../contants.js';
import { report } from '../report.js';
import { state } from '../state.js';
import { jest } from './index.js';

const start = () => window[UI5_TEST_RUNNER].jestStart!();

beforeEach(() => {
  report.reset();
  Object.assign(state, { done: false, type: undefined });
  window[UI5_TEST_RUNNER] = { jestStart: undefined } as (typeof window)[typeof UI5_TEST_RUNNER];
  (window as unknown as { sinon: unknown }).sinon = { createSandbox: () => ({ stub: vi.fn(), resetHistory: vi.fn() }) };
});

afterEach(() => {
  for (const name of ['describe', 'test', 'it', 'beforeAll', 'beforeEach', 'afterEach', 'afterAll', 'expect', 'jest']) {
    delete (window as unknown as Record<string, unknown>)[name];
  }
  delete (window as unknown as { sinon?: unknown }).sinon;
});

describe('global installation', () => {
  it('installs the jest authoring globals', () => {
    jest();
    const globals = window as unknown as Record<string, unknown>;
    expect(typeof globals['describe']).toBe('function');
    expect(typeof globals['test']).toBe('function');
    expect(typeof globals['expect']).toBe('function');
  });

  it('sets the agent state to jest', () => {
    jest();
    expect(state.type).toBe('jest');
  });
});

describe('report bridge', () => {
  it('records a passing test in the report', async () => {
    jest();
    (window as unknown as { describe: (l: string, c: () => void) => void }).describe('group', () => {
      (window as unknown as { test: (l: string, c: () => void) => void }).test('passes', () => {});
    });
    start();
    await vi.waitFor(() => expect(state.done).toBe(true));
    expect(report.results.summary.passed).toBe(1);
    expect(report.results.tests[0]).toMatchObject({ name: 'passes', suite: ['group'], status: 'passed' });
  });

  it('records a failing test with its message and increments errors', async () => {
    jest();
    (window as unknown as { test: (l: string, c: () => void) => void }).test('fails', () => {
      throw new Error('kaboom');
    });
    start();
    await vi.waitFor(() => expect(state.done).toBe(true));
    expect(report.results.tests[0]).toMatchObject({ status: 'failed', message: 'kaboom' });
    expect((state as { errors: number }).errors).toBe(1);
  });

  it('omits the suite for a top-level test', async () => {
    jest();
    (window as unknown as { test: (l: string, c: () => void) => void }).test('top level', () => {});
    start();
    await vi.waitFor(() => expect(state.done).toBe(true));
    expect(report.results.tests[0]!.suite).toBeUndefined();
  });

  it('sets the tool name and version', async () => {
    jest();
    (window as unknown as { test: (l: string, c: () => void) => void }).test('a', () => {});
    start();
    await vi.waitFor(() => expect(state.done).toBe(true));
    expect(report.results.tool).toMatchObject({ name: 'jest', version: '29.7.0' });
  });
});

describe('start guard', () => {
  it('ignores a second jestStart call', async () => {
    jest();
    (window as unknown as { test: (l: string, c: () => void) => void }).test('a', () => {});
    start();
    await vi.waitFor(() => expect(state.done).toBe(true));
    start();
    expect(report.results.summary.tests).toBe(1);
  });
});
