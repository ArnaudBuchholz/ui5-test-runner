import type { JestDescribe, JestTest } from './collect.js';

export type JestStatus = 'passed' | 'failed' | 'skipped' | 'pending';

export interface TestDoneEvent {
  suite: string[];
  name: string;
  status: JestStatus;
  duration: number;
  error?: Error;
}

export interface JestEvents {
  runStart(): void;
  testStart(suite: string[], name: string): void;
  testDone(event: TestDoneEvent): void;
  runFinish(): void;
}

const hasOnly = (describe: JestDescribe): boolean =>
  describe.tests.some((test) => test.mode === 'only') || describe.describes.some((child) => hasOnly(child));

const runHooks = async (hooks: Array<() => void | Promise<void>>): Promise<void> => {
  for (const hook of hooks) {
    await hook();
  }
};

const runTest = async (
  test: JestTest,
  suite: string[],
  beforeEach: Array<() => void | Promise<void>>,
  afterEach: Array<() => void | Promise<void>>,
  events: JestEvents
): Promise<void> => {
  events.testStart(suite, test.label);
  if (test.mode === 'todo') {
    events.testDone({ suite, name: test.label, status: 'pending', duration: 0 });
    return;
  }
  if (test.mode === 'skip') {
    events.testDone({ suite, name: test.label, status: 'skipped', duration: 0 });
    return;
  }
  const start = Date.now();
  try {
    await runHooks(beforeEach);
    await test.callback!();
    await runHooks(afterEach);
    events.testDone({ suite, name: test.label, status: 'passed', duration: Date.now() - start });
  } catch (error) {
    events.testDone({
      suite,
      name: test.label,
      status: 'failed',
      duration: Date.now() - start,
      error: error instanceof Error ? error : new Error(String(error))
    });
  }
};

const runDescribe = async (
  describe: JestDescribe,
  suite: string[],
  beforeEach: Array<() => void | Promise<void>>,
  afterEach: Array<() => void | Promise<void>>,
  hasOnlyMode: boolean,
  events: JestEvents
): Promise<void> => {
  const path = describe.label === undefined ? suite : [...suite, describe.label];
  const nestedBeforeEach = [...beforeEach, ...describe.beforeEach];
  const nestedAfterEach = [...describe.afterEach, ...afterEach];

  await runHooks(describe.beforeAll);
  for (const test of describe.tests) {
    if (hasOnlyMode && test.mode !== 'only' && test.mode !== 'skip' && test.mode !== 'todo') {
      events.testDone({ suite: path, name: test.label, status: 'skipped', duration: 0 });
      continue;
    }
    await runTest(test, path, nestedBeforeEach, nestedAfterEach, events);
  }
  for (const child of describe.describes) {
    await runDescribe(child, path, nestedBeforeEach, nestedAfterEach, hasOnlyMode, events);
  }
  await runHooks(describe.afterAll);
};

export const run = async (root: JestDescribe, events: JestEvents): Promise<void> => {
  events.runStart();
  await runDescribe(root, [], [], [], hasOnly(root), events);
  events.runFinish();
};
