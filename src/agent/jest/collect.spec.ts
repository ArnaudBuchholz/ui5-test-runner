import { it, expect, describe } from 'vitest';
import { Collector } from './collect.js';

describe('describe', () => {
  it('nests child describes under the current block', () => {
    const collector = new Collector();
    collector.describe('parent', () => {
      collector.describe('child', () => {});
    });
    expect(collector.root.describes[0]!.label).toBe('parent');
    expect(collector.root.describes[0]!.describes[0]!.label).toBe('child');
  });

  it('restores the current block after the callback', () => {
    const collector = new Collector();
    collector.describe('first', () => {});
    collector.describe('second', () => {});
    expect(collector.root.describes.map((block) => block.label)).toStrictEqual(['first', 'second']);
  });
});

describe('test', () => {
  it('collects a run test on the current block', () => {
    const collector = new Collector();
    collector.test('a', () => {});
    expect(collector.root.tests[0]).toMatchObject({ label: 'a', mode: 'run' });
  });

  it('collects only/skip/todo modes', () => {
    const collector = new Collector();
    collector.test.only('o', () => {});
    collector.test.skip('s', () => {});
    collector.test.todo('t');
    expect(collector.root.tests.map((test) => test.mode)).toStrictEqual(['only', 'skip', 'todo']);
  });

  it('collects a todo test without a callback', () => {
    const collector = new Collector();
    collector.test.todo('later');
    expect(collector.root.tests[0]!.callback).toBeUndefined();
  });
});

describe('hooks', () => {
  it('collects each hook type on the current block', () => {
    const collector = new Collector();
    const noop = () => {};
    collector.beforeAll(noop);
    collector.beforeEach(noop);
    collector.afterEach(noop);
    collector.afterAll(noop);
    expect(collector.root.beforeAll).toHaveLength(1);
    expect(collector.root.beforeEach).toHaveLength(1);
    expect(collector.root.afterEach).toHaveLength(1);
    expect(collector.root.afterAll).toHaveLength(1);
  });
});
