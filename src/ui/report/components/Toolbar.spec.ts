import { describe, it, expect } from 'vitest';
import { renderToolbar } from './Toolbar.js';
import { stateFromTests } from './testFixture.js';
import { FILTER_ON_STATUS, SORT_BY } from '../../../reports/ui/constants.js';

const SETTINGS = { filterOnStatus: FILTER_ON_STATUS, sortBy: SORT_BY };

describe('renderToolbar', () => {
  it('renders status, search and sort controls', () => {
    const html = renderToolbar(stateFromTests([{ status: 'passed' }]), SETTINGS);
    expect(html).toContain('id="statusSelect"');
    expect(html).toContain('id="searchInput"');
    expect(html).toContain('id="sortSelect"');
  });

  it('marks the current status and sort options as selected', () => {
    const state = {
      ...stateFromTests([{ status: 'passed' }]),
      filterOnStatus: 'failed' as const,
      sortBy: 'name' as const
    };
    const html = renderToolbar(state, SETTINGS);
    expect(html).toContain('<option value="failed" selected>');
    expect(html).toContain('<option value="name" selected>');
  });

  it('reflects the free-text search value', () => {
    const state = { ...stateFromTests([{ status: 'passed' }]), search: 'odata' };
    expect(renderToolbar(state, SETTINGS)).toContain('value="odata"');
  });

  it('disables the direction button when sorting by execution order', () => {
    const html = renderToolbar(stateFromTests([{ status: 'passed' }]), SETTINGS);
    expect(html).toMatch(/id="sortDirBtn"[^>]*disabled/);
  });

  it('shows how many of the total tests are shown', () => {
    const html = renderToolbar(stateFromTests([{ status: 'passed' }, { status: 'failed' }]), SETTINGS);
    expect(html).toContain('2 of 2 shown');
  });
});
