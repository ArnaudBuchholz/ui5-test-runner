import { describe, it, expect } from 'vitest';
import { renderTestDetails } from './TestDetails.js';
import { stateFromTests } from './testFixture.js';
import type { State } from '../../../reports/ui/types.js';

function firstTest(state: State) {
  return state.tests[0]!;
}

describe('renderTestDetails', () => {
  it('always renders the duration', () => {
    const state = stateFromTests([{ status: 'passed', duration: 1500 }]);
    expect(renderTestDetails(firstTest(state), 0)).toContain('2s');
  });

  it('renders the failure message and stack trace', () => {
    const state = stateFromTests([{ status: 'failed', message: 'boom', trace: 'at foo (bar.js:1:1)' }]);
    const html = renderTestDetails(firstTest(state), 0);
    expect(html).toContain('boom');
    expect(html).toContain('class="trace"');
    expect(html).toContain('at foo (bar.js:1:1)');
  });

  it('renders actual/expected from extra as a diff', () => {
    const state = stateFromTests([{ status: 'failed', extra: { actual: 'true', expected: '"true"' } }]);
    const html = renderTestDetails(firstTest(state), 0);
    expect(html).toContain('diff__actual');
    expect(html).toContain('diff__expected');
    expect(html).toContain('&quot;true&quot;');
  });

  it('renders a collapsible, collapsed-by-default QUnit assertion list', () => {
    const state = stateFromTests([
      {
        status: 'failed',
        extra: {
          QUnitLogs: [
            { result: true, message: 'ok' },
            { result: false, message: 'nope', actual: '1', expected: '2' }
          ]
        }
      }
    ]);
    const html = renderTestDetails(firstTest(state), 3);
    expect(html).toContain('Assertions (2)');
    expect(html).toContain('data-assert-index="3"');
    expect(html).toContain('style="display:none"');
    expect(html).toContain('assert__icon--pass');
    expect(html).toContain('assert__icon--fail');
  });

  it('lazy-loads image attachments via data-src (not src)', () => {
    const state = stateFromTests([
      {
        status: 'failed',
        attachments: [{ name: 'shot', contentType: 'image/png', path: '/a/b.png' }]
      }
    ]);
    const html = renderTestDetails(firstTest(state), 0);
    expect(html).toContain('data-src="/a/b.png"');
    // the img must not be eagerly loaded — no bare src attribute
    expect(html).not.toMatch(/\ssrc="/);
  });

  it('renders non-image attachments as links', () => {
    const state = stateFromTests([
      {
        status: 'failed',
        attachments: [{ name: 'log', contentType: 'text/plain', path: '/a/b.txt' }]
      }
    ]);
    const html = renderTestDetails(firstTest(state), 0);
    expect(html).toContain('<a href="/a/b.txt"');
  });

  it('renders a screenshot when present', () => {
    const state = stateFromTests([{ status: 'failed', screenshot: '/s.png' }]);
    const html = renderTestDetails(firstTest(state), 0);
    expect(html).toContain('data-src="/s.png"');
  });
});
