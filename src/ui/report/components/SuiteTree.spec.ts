import { describe, it, expect } from 'vitest';
import { renderSuiteTree } from './SuiteTree.js';
import { stateFromTests } from './testFixture.js';

const CORE = 'http://localhost:8000/Test.qunit.html?test=core';
const MODEL = 'http://localhost:8000/Test.qunit.html?test=model';

describe('renderSuiteTree', () => {
  it('always renders an "All tests" node with the total count', () => {
    const html = renderSuiteTree(stateFromTests([{ suite: [CORE, 'a'], status: 'passed' }]));
    expect(html).toContain('All tests');
    expect(html).toContain('<span class="tnode__count">1</span>');
  });

  it('aggregates total and failed counts onto the parent suite', () => {
    const html = renderSuiteTree(
      stateFromTests([
        { suite: [CORE, 'a'], status: 'passed' },
        { suite: [CORE, 'b'], status: 'failed' },
        { suite: [MODEL, 'c'], status: 'passed' }
      ])
    );
    // core subtree has 2 tests, 1 failed
    expect(html).toContain('✗1');
    expect(html).toMatch(/core[\s\S]*tnode__count">2</);
  });

  it('marks the active suite node', () => {
    const state = stateFromTests([{ suite: [CORE, 'a'], status: 'passed' }]);
    const activeUid = state.suites[0]!.uid;
    const html = renderSuiteTree({ ...state, filterOnSuiteUid: activeUid });
    expect(html).toContain('tnode--active');
  });

  it('does not render a selectable "No suite" node (it shares the empty uid with "All tests")', () => {
    const html = renderSuiteTree(stateFromTests([{ status: 'passed' }]));
    expect(html).not.toContain('No suite');
  });
});
