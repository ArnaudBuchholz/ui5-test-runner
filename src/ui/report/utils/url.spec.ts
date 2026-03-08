import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveStateToHash, loadStateFromHash } from './url.js';
import type { State } from '../types.js';

describe('url utils', () => {
  let state: State;

  beforeEach(() => {
    state = {
      report: null,
      filters: { suite: '', status: '', search: '' },
      sort: { criteria: 'name', order: 'asc' },
      invalidReport: false
    };
    // Mock window.location and history.pushState
    vi.stubGlobal('location', { hash: '', pathname: '/' });
    vi.stubGlobal('history', { pushState: vi.fn() });
  });

  describe('saveStateToHash', () => {
    it('should save filters to hash', () => {
      state.filters.suite = 'sap.m.Button';
      state.filters.status = 'passed';
      saveStateToHash(state);
      expect(history.pushState).toHaveBeenCalledWith(
        null,
        '',
        '#suite=sap.m.Button&status=passed&sort=name&sort-order=asc'
      );
    });
  });

  describe('loadStateFromHash', () => {
    it('should load filters from hash', () => {
      vi.stubGlobal('location', { hash: '#suite=sap.m.Input&q=test', pathname: '/' });
      loadStateFromHash(state);
      expect(state.filters.suite).toBe('sap.m.Input');
      expect(state.filters.search).toBe('test');
    });
  });
});
