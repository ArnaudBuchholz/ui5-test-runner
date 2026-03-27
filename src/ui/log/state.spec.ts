import { describe, it, expect, beforeEach } from 'vitest';
import { getState, setState, subscribe } from './state.js';

describe('state', () => {
  beforeEach(() => {
    // Reset to a known state between tests by using setState
    setState({
      timeRange: { mode: 'relative', preset: '15m' },
      autoRefresh: false,
      autoRefreshInterval: 10,
      lastRefresh: null,
      filterExpression: '',
      searchText: '',
      filterError: null,
      selectedEntryIndex: null,
      entries: [],
      metrics: null,
      isLive: false
    });
  });

  it('returns the default state', () => {
    const state = getState();
    expect(state.timeRange).toEqual({ mode: 'relative', preset: '15m' });
    expect(state.autoRefresh).toBe(false);
    expect(state.entries).toHaveLength(0);
  });

  it('merges partial updates without losing other fields', () => {
    setState({ filterExpression: 'level === "error"' });
    const state = getState();
    expect(state.filterExpression).toBe('level === "error"');
    expect(state.autoRefresh).toBe(false);
  });

  it('notifies subscribers on state change', () => {
    const received: string[] = [];
    subscribe((s) => {
      received.push(s.filterExpression);
    });
    setState({ filterExpression: 'source === "job"' });
    // subscriber is called immediately on subscribe (with current) and then on each change
    expect(received).toContain('source === "job"');
  });
});
