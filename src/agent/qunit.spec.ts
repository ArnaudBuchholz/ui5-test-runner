import { it, expect, beforeAll, beforeEach, describe, vi } from 'vitest';
import { qunit } from './qunit.js';
import { report } from './report.js';
import { state } from './state.js';
import type { Configuration } from './Configuration.js';

vi.mock(import('./config.js'), () => ({ getConfig: vi.fn() }));
import { getConfig } from './config.js';

const DEFAULT_CONFIG = {
  agentDetectionTimeout: 5000,
  agentDetectionInterval: 100,
  agentDetectionMaxInterval: 1000,
  agentNoTestsTimeout: 5000,
  browser: '',
  pageId: 1,
  parallel: 1,
  screenshot: false,
  splitOpa: false
} as Configuration;

const id = expect.any(String) as string;
const trace = expect.any(String) as string;

beforeAll(() => {
  // Keeping the jsdom context, we need to tweak QUnit to prevent autostart
  Object.defineProperty(window.document, 'readyState', {
    get() {
      return 'unknown';
    }
  });
  // Remove useless warnings
  window.scrollTo = () => {};
});

beforeEach(async () => {
  report.reset();
  Object.assign(state, { done: false, type: undefined });
  delete window.QUnit;
  // works because of vitest.config.ts' config of qunit inline
  vi.resetModules();
  const QUnit = await import('qunit');
  window.QUnit = QUnit;
  vi.mocked(getConfig).mockReturnValue(DEFAULT_CONFIG);
  vi.stubGlobal('location', new URL('http://localhost/test/opa.html'));
});

const execQunit = async () => {
  qunit();
  QUnit.start();
  window.dispatchEvent(new Event('load'));
  await vi.waitFor(() => expect(state.done).toBe(true));
  return report.results;
};

it('reports test results from actual QUnit execution', async () => {
  QUnit.module('suite1');
  QUnit.test('test1', (assert) => {
    assert.ok(true);
  });

  const results = await execQunit();

  expect(results.summary.tests).toBe(1);
  expect(results.summary.passed).toBe(1);
  expect(results.tests).toMatchObject([
    {
      id,
      name: 'test1',
      status: 'passed',
      suite: ['suite1']
    }
  ]);
  expect(results.tool.name).toBe('QUnit');
  expect(results.tool.version).toBeDefined();
  expect(results.summary.start).toBeGreaterThan(0);
  expect(results.summary.stop).toBeGreaterThan(0);
});

it('documents a test failure', async () => {
  QUnit.module('suite1');
  QUnit.test('test1', (assert) => {
    assert.ok(false);
  });

  const results = await execQunit();

  expect(results.summary.tests).toBe(1);
  expect(results.summary.failed).toBe(1);
  expect(results.tests).toMatchObject([
    {
      id,
      name: 'test1',
      status: 'failed',
      suite: ['suite1'],
      message: 'failed, expected argument to be truthy, was: false',
      trace
    }
  ]);
});

it('generates a default error message', async () => {
  QUnit.module('suite1');
  QUnit.test('test1', (assert) => {
    assert.strictEqual(1, 2);
  });

  const results = await execQunit();

  expect(results.summary.tests).toBe(1);
  expect(results.summary.failed).toBe(1);
  expect(results.tests).toMatchObject([
    {
      id,
      name: 'test1',
      status: 'failed',
      suite: ['suite1'],
      message: 'failed',
      trace
    }
  ]);
});

it('documents only the first failed assertion of a test (but provides the logs)', async () => {
  QUnit.module('suite1');
  QUnit.test('test1', (assert) => {
    assert.ok(true);
    assert.strictEqual(1, 2, 'failed 1');
    assert.strictEqual(2, 3, 'failed 2');
  });

  const results = await execQunit();

  expect(results.summary.tests).toBe(1);
  expect(results.summary.failed).toBe(1);
  expect(results.tests).toMatchObject([
    {
      id,
      name: 'test1',
      status: 'failed',
      suite: ['suite1'],
      message: 'failed 1',
      trace,
      extra: {
        actual: '1',
        expected: '2',
        QUnitLogs: expect.any(Array) as unknown[]
      }
    }
  ]);
});

it('documents skipped tests', async () => {
  QUnit.module('suite1');
  QUnit.skip('test1', (assert) => {
    assert.ok(false);
  });

  const results = await execQunit();

  expect(results.summary.tests).toBe(1);
  expect(results.summary.skipped).toBe(1);
  expect(results.tests).toMatchObject([
    {
      id,
      name: 'test1',
      status: 'skipped',
      suite: ['suite1']
    }
  ]);
});

it('documents pending tests (QUnit.todo)', async () => {
  QUnit.module('suite1');
  QUnit.todo('test1', (assert) => {
    assert.ok(true);
  });

  const results = await execQunit();

  expect(results.summary.tests).toBe(1);
  expect(results.summary.pending).toBe(1);
  expect(results.tests).toMatchObject([
    {
      id,
      name: 'test1',
      status: 'pending',
      suite: ['suite1']
    }
  ]);
});

it('splits OPA page by module when splitOpa is enabled', async () => {
  vi.mocked(getConfig).mockReturnValue({ ...DEFAULT_CONFIG, splitOpa: true });
  window.sap = { ui: { test: { Opa5: class {} } } };

  QUnit.module('Journey1');
  QUnit.test('step1', (assert) => assert.ok(true));
  QUnit.module('Journey2');
  QUnit.test('step2', (assert) => assert.ok(true));

  await execQunit();

  expect(state).toMatchObject({
    done: true,
    type: 'suite',
    pages: [expect.stringContaining('moduleId='), expect.stringContaining('moduleId=')]
  });
});

it('does not split when moduleId is already in URL (already a split page)', async () => {
  vi.mocked(getConfig).mockReturnValue({ ...DEFAULT_CONFIG, splitOpa: true });
  window.sap = { ui: { test: { Opa5: class {} } } };
  vi.stubGlobal('location', new URL('http://localhost/test/opa.html?moduleId='));

  QUnit.module('Journey1');
  QUnit.test('step1', (assert) => assert.ok(true));
  QUnit.module('Journey2');
  QUnit.test('step2', (assert) => assert.ok(true));

  const results = await execQunit();

  expect(state.type).toBe('QUnit');
  expect(results.summary.tests).toBe(2);
});

it('returns 0 for total when moduleId in URL matches no registered module', async () => {
  vi.stubGlobal('location', new URL('http://localhost/test/opa.html?moduleId=nonexistent'));
  QUnit.module('Journey1');
  QUnit.test('step1', (assert) => assert.ok(true));

  await execQunit();

  expect(state).toMatchObject({ type: 'QUnit', total: 0 });
});

it('counts only the matching module tests when moduleId is in URL', async () => {
  QUnit.module('Journey1');
  QUnit.test('step1', (assert) => assert.ok(true));
  QUnit.module('Journey2');
  QUnit.test('step2', (assert) => assert.ok(true));
  QUnit.test('step3', (assert) => assert.ok(true));

  const modules = (QUnit.config as unknown as { modules: { name: string; moduleId: string }[] }).modules;
  const journey1Id = modules.find((m) => m.name === 'Journey1')!.moduleId;
  vi.stubGlobal('location', new URL(`http://localhost/test/opa.html?moduleId=${journey1Id}`));

  await execQunit();

  expect(state).toMatchObject({ type: 'QUnit', total: 1 });
});

type QUnitCallbacks = {
  testDone: ((d: object) => void)[];
  log: ((d: object) => void)[];
  done: ((d: object) => void)[];
  moduleStart: ((d: object) => void)[];
};
const qunitCallbacks = () => (QUnit.config as unknown as { callbacks: QUnitCallbacks }).callbacks;

it('sets message to "No logs" when a failed test has no log entries', () => {
  QUnit.module('suite1');
  QUnit.test('test1', () => {});

  qunit();

  qunitCallbacks().testDone.at(-1)!({
    testId: 'ghost-id',
    name: 'ghost',
    module: 'suite1',
    passed: 0,
    failed: 1,
    skipped: false,
    todo: false,
    runtime: 0,
    assertions: []
  });

  const ghostTest = report.results.tests.find((t) => t.name === 'ghost');
  expect(ghostTest?.message).toBe('No logs');
});

it('sets message to "No error log" when a failed test has only passing log entries', () => {
  QUnit.module('suite1');
  QUnit.test('test1', () => {});

  qunit();

  // Push a passing log entry for 'ghost-id'
  qunitCallbacks().log.at(-1)!({ testId: 'ghost-id', result: true, name: 'ok', module: 'suite1' });

  // Then fire testDone with failed > 0 — testLogs exists but all results are true
  qunitCallbacks().testDone.at(-1)!({
    testId: 'ghost-id',
    name: 'ghost',
    module: 'suite1',
    passed: 0,
    failed: 1,
    skipped: false,
    todo: false,
    runtime: 0,
    assertions: []
  });

  const ghostTest = report.results.tests.find((t) => t.name === 'ghost');
  expect(ghostTest?.message).toBe('No error log');
});

it('delays done and then completes when QUnit fires with no tests recorded', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.mocked(getConfig).mockReturnValue({ ...DEFAULT_CONFIG, agentNoTestsTimeout: 100 });

  qunit();

  // Directly invoke the registered QUnit.done callback with 0 tests
  qunitCallbacks().done.at(-1)!({ passed: 0, failed: 0, total: 0, runtime: 0 });

  expect(state.done).toBe(false);
  await vi.advanceTimersByTimeAsync(100);
  expect(state.done).toBe(true);
  vi.useRealTimers();
});

it('updates total in moduleStart when new tests are added dynamically', () => {
  QUnit.module('suite1');
  QUnit.test('test1', (assert) => assert.ok(true));

  qunit();

  // state.total is 1 after begin; add another test so countTotalTests() returns 2
  QUnit.module('suite2');
  QUnit.test('test2', (assert) => assert.ok(true));

  qunitCallbacks().moduleStart.at(-1)!({ name: 'suite2', tests: [] });

  expect(state).toMatchObject({ type: 'QUnit', total: 2 });
});

describe('screenshot (OPA)', () => {
  const PAGE_ID = 1;
  const waitFor = vi.fn();

  beforeEach(() => {
    vi.mocked(getConfig).mockReturnValue({ ...DEFAULT_CONFIG, screenshot: true, pageId: PAGE_ID });
    class Opa5 {}
    Object.assign(Opa5.prototype, { waitFor });
    window.sap = { ui: { test: { Opa5 } } };
  });

  it('sets pendingScreenshot to the expected filename on OPA QUnit.log', async () => {
    let capturedPendingScreenshot: string | false = false;
    QUnit.module('Journey1');
    QUnit.test('step1', (assert) => {
      assert.ok(true);
      expect.assert(state.type === 'QUnit');
      capturedPendingScreenshot = state.pendingScreenshot;
    });

    await execQunit();

    expect(capturedPendingScreenshot).toMatch(/^1-[a-f0-9]+-0\.png$/);
  });

  const expectPath = expect.stringMatching(/^1-[a-f0-9]+-\d\.png$/) as string;

  it('attaches screenshots to the test result via attachments[], using the log message as name', async () => {
    QUnit.module('Journey1');
    QUnit.test('step1', (assert) => {
      assert.ok(true, 'first step');
      assert.ok(false);
    });

    const results = await execQunit();

    const test = results.tests[0]!;
    expect(test.attachments).toHaveLength(2);
    expect(test.attachments![0] as object).toMatchObject({
      name: 'first step',
      contentType: 'image/png',
      path: expectPath
    });
    expect(test.attachments![1] as object).toMatchObject({
      name: expect.stringMatching(/failed/) as string, // good enough
      contentType: 'image/png',
      path: expectPath
    });
  });

  it('waitFor check returns true once pendingScreenshot is cleared', async () => {
    QUnit.module('Journey1');
    QUnit.test('step1', (assert) => assert.ok(true));

    let capturedCheck: (() => boolean) | undefined;
    waitFor.mockImplementation((settings: { check: () => boolean }) => {
      capturedCheck = settings.check;
    });

    await execQunit();

    expect.assert(capturedCheck !== undefined);
    expect.assert(state.type === 'QUnit');
    state.pendingScreenshot = 'some.png';
    expect(capturedCheck()).toBe(false);
    state.pendingScreenshot = false;
    expect(capturedCheck()).toBe(true);
  });
});
