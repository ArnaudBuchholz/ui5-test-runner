import { describe, it, expect } from 'vitest';
import { renderSummaryBar } from './SummaryBar.js';
import { stateFromTests } from './testFixture.js';

describe('renderSummaryBar', () => {
  it('renders a count per status with icon and label', () => {
    const html = renderSummaryBar(
      stateFromTests([{ status: 'passed' }, { status: 'passed' }, { status: 'failed' }, { status: 'skipped' }])
    );
    expect(html).toContain('<span class="count__n">4</span> total');
    expect(html).toContain('<span class="count__n">2</span> passed');
    expect(html).toContain('<span class="count__n">1</span> failed');
    expect(html).toContain('<span class="count__n">1</span> skipped');
  });

  it('folds pending into the "other" count', () => {
    const html = renderSummaryBar(stateFromTests([{ status: 'pending' }, { status: 'other' }]));
    expect(html).toContain('<span class="count__n">2</span> other');
  });

  it('omits zero-count segments from the proportion bar but keeps them in the counts', () => {
    const html = renderSummaryBar(stateFromTests([{ status: 'passed' }]));
    expect(html).not.toContain('propbar__seg--fail');
    expect(html).toContain('propbar__seg--pass');
    expect(html).toContain('<span class="count__n">0</span> failed');
  });

  it('exposes the breakdown to assistive tech via aria-label', () => {
    const html = renderSummaryBar(stateFromTests([{ status: 'passed' }, { status: 'failed' }]));
    expect(html).toContain('aria-label="1 passed, 1 failed, 0 skipped, 0 other"');
  });
});
