import { it, expect, describe, vi } from 'vitest';
import { Collector } from './collect.js';
import { run } from './run.js';
import type { JestEvents, TestDoneEvent } from './run.js';

const recordEvents = () => {
  const done: TestDoneEvent[] = [];
  const order: string[] = [];
  const events: JestEvents = {
    runStart: () => {
      order.push('runStart');
    },
    testStart: (suite, name) => {
      order.push(`start:${[...suite, name].join('>')}`);
    },
    testDone: (event) => {
      done.push(event);
      order.push(`done:${event.name}:${event.status}`);
    },
    runFinish: () => {
      order.push('runFinish');
    }
  };
  return { done, order, events };
};

describe('when all tests pass', () => {
  it('reports each test as passed', async () => {
    const collector = new Collector();
    collector.describe('group', () => {
      collector.test('a', () => {});
      collector.test('b', () => {});
    });
    const { done, events } = recordEvents();
    await run(collector.root, events);
    expect(done.map((event) => event.status)).toStrictEqual(['passed', 'passed']);
  });
});

describe('when a test throws', () => {
  it('reports it as failed with the error', async () => {
    const collector = new Collector();
    const failure = new Error('boom');
    collector.test('explodes', () => {
      throw failure;
    });
    const { done, events } = recordEvents();
    await run(collector.root, events);
    expect(done[0]).toMatchObject({ name: 'explodes', status: 'failed', error: failure });
  });
});

describe('when a test rejects', () => {
  it('reports it as failed', async () => {
    const collector = new Collector();
    collector.test('rejects', async () => {
      await Promise.reject(new Error('async boom'));
    });
    const { done, events } = recordEvents();
    await run(collector.root, events);
    expect(done[0]!.status).toBe('failed');
  });
});

describe('when a test throws a non-error', () => {
  it('wraps the thrown value in an Error', async () => {
    const collector = new Collector();
    collector.test('throws string', () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- verifying non-Error throws are wrapped
      throw 'plain string';
    });
    const { done, events } = recordEvents();
    await run(collector.root, events);
    expect(done[0]!.error!.message).toBe('plain string');
  });
});

describe('when a test is skipped', () => {
  it('reports it as skipped without running the callback', async () => {
    const collector = new Collector();
    const callback = vi.fn();
    collector.test.skip('skipped', callback);
    const { done, events } = recordEvents();
    await run(collector.root, events);
    expect(done[0]!.status).toBe('skipped');
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('when a test is todo', () => {
  it('reports it as pending', async () => {
    const collector = new Collector();
    collector.test.todo('later');
    const { done, events } = recordEvents();
    await run(collector.root, events);
    expect(done[0]!.status).toBe('pending');
  });
});

describe('when a test is marked only', () => {
  it('skips the non-only tests', async () => {
    const collector = new Collector();
    collector.test('normal', () => {});
    collector.test.only('focused', () => {});
    const { done, events } = recordEvents();
    await run(collector.root, events);
    expect(done.find((event) => event.name === 'normal')!.status).toBe('skipped');
    expect(done.find((event) => event.name === 'focused')!.status).toBe('passed');
  });
});

describe('suite hierarchy', () => {
  it('reports the ancestor describe chain', async () => {
    const collector = new Collector();
    collector.describe('outer', () => {
      collector.describe('inner', () => {
        collector.test('deep', () => {});
      });
    });
    const { done, events } = recordEvents();
    await run(collector.root, events);
    expect(done[0]!.suite).toStrictEqual(['outer', 'inner']);
  });
});

describe('hook execution order', () => {
  it('runs beforeAll/beforeEach/afterEach/afterAll in jest order across nesting', async () => {
    const collector = new Collector();
    const log: string[] = [];
    collector.describe('outer', () => {
      collector.beforeAll(() => {
        log.push('outer beforeAll');
      });
      collector.beforeEach(() => {
        log.push('outer beforeEach');
      });
      collector.afterEach(() => {
        log.push('outer afterEach');
      });
      collector.afterAll(() => {
        log.push('outer afterAll');
      });
      collector.test('outer test', () => {
        log.push('outer test');
      });
      collector.describe('inner', () => {
        collector.beforeEach(() => {
          log.push('inner beforeEach');
        });
        collector.test('inner test', () => {
          log.push('inner test');
        });
      });
    });
    const { events } = recordEvents();
    await run(collector.root, events);
    expect(log).toStrictEqual([
      'outer beforeAll',
      'outer beforeEach',
      'outer test',
      'outer afterEach',
      'outer beforeEach',
      'inner beforeEach',
      'inner test',
      'outer afterEach',
      'outer afterAll'
    ]);
  });
});

describe('run lifecycle', () => {
  it('emits runStart before tests and runFinish after', async () => {
    const collector = new Collector();
    collector.test('a', () => {});
    const { order, events } = recordEvents();
    await run(collector.root, events);
    expect(order[0]).toBe('runStart');
    expect(order.at(-1)).toBe('runFinish');
  });
});
