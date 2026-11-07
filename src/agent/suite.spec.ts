import { it, expect, beforeEach, vi } from 'vitest';

const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});

const { state } = await import('./state.js');
const { suite, JsUnitTestSuite } = await import('./suite.js');
const { setTimeout } = await import('node:timers/promises');

beforeEach(() => {
  errorSpy.mockClear();
  delete window.suite;
  JsUnitTestSuite.pages = undefined;
  Object.assign(state, {
    done: false,
    type: undefined,
    pages: undefined
  });
});

it('fails on suite that does not create a JsUnitTestSuite instance', async () => {
  window.suite = vi.fn();
  await suite();
  expect.assert(state.type === 'unknown');
});

it('supports empty suite', async () => {
  window.suite = vi.fn(() => {
    const JsUnitTestSuite = window.jsUnitTestSuite;
    const testSuite = new JsUnitTestSuite();
    expect(testSuite).toBeInstanceOf(JsUnitTestSuite);
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([]);
});

it('supports multiple pages (sync)', async () => {
  window.suite = vi.fn(() => {
    const JsUnitTestSuite = window.jsUnitTestSuite;
    const testSuite = new JsUnitTestSuite();
    testSuite.addTestPage('test1.html');
    testSuite.addTestPage('test2.html');
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([{ url: 'test1.html' }, { url: 'test2.html' }]);
});

it('supports multiple pages (async)', async () => {
  window.suite = vi.fn(async () => {
    const JsUnitTestSuite = window.jsUnitTestSuite;
    const testSuite = new JsUnitTestSuite();
    await setTimeout(50);
    testSuite.addTestPage('test1.html');
    await setTimeout(50);
    testSuite.addTestPage('test2.html');
    await setTimeout(50);
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([{ url: 'test1.html' }, { url: 'test2.html' }]);
});

it('captures coverage only and never from the page config', async () => {
  window.suite = vi.fn(() => {
    const testSuite = new window.jsUnitTestSuite();
    testSuite.addTestPage('test1.html', { coverage: { only: 'sap/ui/demo/todo/', never: 'test-resources/' } });
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([
    { url: 'test1.html', coverage: { only: 'sap/ui/demo/todo/', never: 'test-resources/' } }
  ]);
});

it('captures loader paths from the page config', async () => {
  window.suite = vi.fn(() => {
    const testSuite = new window.jsUnitTestSuite();
    testSuite.addTestPage('test1.html', {
      coverage: { only: 'sap/ui/demo/todo/' },
      loader: { paths: { 'sap/ui/demo/todo': '../' } }
    });
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([
    { url: 'test1.html', coverage: { only: 'sap/ui/demo/todo/' }, loaderPaths: { 'sap/ui/demo/todo': '../' } }
  ]);
});

it('omits loader paths when they are not a string record', async () => {
  window.suite = vi.fn(() => {
    const testSuite = new window.jsUnitTestSuite();
    testSuite.addTestPage('test1.html', { loader: { paths: { 'sap/ui/demo/todo': 42 } } });
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([{ url: 'test1.html' }]);
});

it('logs an error when loader paths are present but invalid', async () => {
  window.suite = vi.fn(() => {
    new window.jsUnitTestSuite().addTestPage('test1.html', { loader: { paths: { 'sap/ui/demo/todo': 42 } } });
  });
  await suite();
  expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('invalid loader.paths'));
});

it('logs an error when a coverage pattern is present but invalid', async () => {
  window.suite = vi.fn(() => {
    new window.jsUnitTestSuite().addTestPage('test1.html', { coverage: { only: 42 } });
  });
  await suite();
  expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('invalid coverage.only'));
});

it('logs an error when the coverage property is present but not an object', async () => {
  window.suite = vi.fn(() => {
    new window.jsUnitTestSuite().addTestPage('test1.html', { coverage: null });
  });
  await suite();
  expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('invalid coverage'));
});

it('does not log an error when coverage and loader are simply absent', async () => {
  window.suite = vi.fn(() => {
    new window.jsUnitTestSuite().addTestPage('test1.html', { name: 'unit' });
  });
  await suite();
  expect(errorSpy).not.toHaveBeenCalled();
});

it('omits loader paths when the loader has no paths key', async () => {
  window.suite = vi.fn(() => {
    const testSuite = new window.jsUnitTestSuite();
    testSuite.addTestPage('test1.html', { loader: {} });
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([{ url: 'test1.html' }]);
});

it('preserves array coverage patterns', async () => {
  window.suite = vi.fn(() => {
    const testSuite = new window.jsUnitTestSuite();
    testSuite.addTestPage('test1.html', { coverage: { only: ['a/', 'b/'] } });
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([{ url: 'test1.html', coverage: { only: ['a/', 'b/'] } }]);
});

it('captures never without only', async () => {
  window.suite = vi.fn(() => {
    const testSuite = new window.jsUnitTestSuite();
    testSuite.addTestPage('test1.html', { coverage: { never: 'test-resources/' } });
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([{ url: 'test1.html', coverage: { never: 'test-resources/' } }]);
});

it('omits coverage when the config has no coverage block', async () => {
  window.suite = vi.fn(() => {
    const testSuite = new window.jsUnitTestSuite();
    testSuite.addTestPage('test1.html', { name: 'unit' });
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([{ url: 'test1.html' }]);
});

it('omits coverage when only and never are not strings or string arrays', async () => {
  window.suite = vi.fn(() => {
    const testSuite = new window.jsUnitTestSuite();
    testSuite.addTestPage('test1.html', { coverage: { only: 42, never: [1, 2] } });
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([{ url: 'test1.html' }]);
});

it('omits coverage when the config is not an object', async () => {
  window.suite = vi.fn(() => {
    const testSuite = new window.jsUnitTestSuite();
    testSuite.addTestPage('test1.html', 'not-an-object');
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([{ url: 'test1.html' }]);
});

it('omits coverage when the coverage property is not an object', async () => {
  window.suite = vi.fn(() => {
    const testSuite = new window.jsUnitTestSuite();
    testSuite.addTestPage('test1.html', { coverage: null });
  });
  await suite();
  expect.assert(state.type === 'suite');
  expect(state.pages).toStrictEqual([{ url: 'test1.html' }]);
});

it('does not absorb errors (intercepted globally)', async () => {
  const error = new Error('KO');
  window.suite = vi.fn(() => {
    throw error;
  });
  await expect(suite()).rejects.toThrow(error);
});
