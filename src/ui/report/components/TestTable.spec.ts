import { describe, it, expect } from 'vitest';
import { renderThead, renderTableWindow, ROW_HEIGHT } from './TestTable.js';
import { stateFromTests } from './testFixture.js';
import type { DeepPartial } from '../../../types/typeUtilities.js';
import type { CTRFTest } from '../../../types/CommonTestReportFormat.js';

const MANY = 1000;

function manyTests(): DeepPartial<CTRFTest>[] {
  return Array.from({ length: MANY }, (_, index) => ({ name: `test-${index}`, status: 'passed' as const }));
}

describe('renderThead', () => {
  it('renders the four column headers', () => {
    const html = renderThead();
    expect(html).toContain('Status');
    expect(html).toContain('Test');
    expect(html).toContain('Suite');
    expect(html).toContain('Duration');
  });
});

describe('renderTableWindow', () => {
  it('shows an empty message when there are no tests', () => {
    const html = renderTableWindow(stateFromTests([]), new Set(), new Map(), 0, 500);
    expect(html).toContain('No tests match');
  });

  it('sizes the scroll area to the full row count, not the rendered window', () => {
    const state = stateFromTests(manyTests());
    const html = renderTableWindow(state, new Set(), new Map(), 0, 400);
    expect(html).toContain(`height:${MANY * ROW_HEIGHT}px`);
  });

  it('renders only the rows near the viewport, not all of them', () => {
    const state = stateFromTests(manyTests());
    const html = renderTableWindow(state, new Set(), new Map(), 0, 400);
    const rendered = html.match(/class="row"/g)?.length ?? 0;
    // viewport ≈ 400/33 ≈ 12 rows + overscan, far fewer than 1000
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(60);
  });

  it('offsets the window to the first visible row when scrolled', () => {
    const state = stateFromTests(manyTests());
    const scrollTop = 300 * ROW_HEIGHT;
    const html = renderTableWindow(state, new Set(), new Map(), scrollTop, 400);
    const start = Number(/data-start="(\d+)"/.exec(html)?.[1]);
    expect(start).toBeGreaterThan(290);
    expect(start).toBeLessThanOrEqual(300);
    // the test around the scroll position is in the window
    expect(html).toContain('test-300');
    // far-away rows are not rendered
    expect(html).not.toContain('>test-0<');
  });

  it('renders details for an expanded row within the window', () => {
    const state = stateFromTests([{ name: 'solo', status: 'failed', message: 'boom', duration: 5 }]);
    const html = renderTableWindow(state, new Set([0]), new Map(), 0, 400);
    expect(html).toContain('class="details"');
    expect(html).toContain('boom');
  });
});
