import { describe, it, expect, beforeEach } from 'vitest';
import { readHash, writeHash } from './hash.js';

describe('readHash', () => {
  beforeEach(() => {
    history.replaceState(null, '', '#');
  });

  it('returns empty object for empty hash', () => {
    expect(readHash()).toEqual({});
  });

  it('parses all fields', () => {
    history.replaceState(null, '', '#suite=Module+A&status=failed&q=test&sort=name&sort-order=asc');
    expect(readHash()).toEqual({
      filterOnSuiteUid: 'Module A',
      filterOnStatus: 'failed',
      search: 'test',
      sortBy: 'name',
      sortAscending: true
    });
  });

  it('treats sort-order=desc as sortAscending false', () => {
    history.replaceState(null, '', '#sort-order=desc');
    expect(readHash().sortAscending).toBe(false);
  });

  it('treats sort-order=asc as sortAscending true', () => {
    history.replaceState(null, '', '#sort-order=asc');
    expect(readHash().sortAscending).toBe(true);
  });

  it('decodes suite UID with carriage return separator', () => {
    history.replaceState(null, '', '#suite=Module+A%0DComponent+B');
    expect(readHash().filterOnSuiteUid).toBe('Module A\rComponent B');
  });
});

describe('writeHash', () => {
  it('writes all fields to the hash', () => {
    writeHash({ filterOnSuiteUid: '', filterOnStatus: 'failed', search: '', sortBy: 'name', sortAscending: true });
    const parameters = new URLSearchParams(location.hash.slice(1));
    expect(parameters.get('status')).toBe('failed');
    expect(parameters.get('sort')).toBe('name');
    expect(parameters.get('sort-order')).toBe('asc');
  });

  it('writes sort-order=desc when not ascending', () => {
    writeHash({ filterOnSuiteUid: '', filterOnStatus: '', search: '', sortBy: 'duration', sortAscending: false });
    const parameters = new URLSearchParams(location.hash.slice(1));
    expect(parameters.get('sort-order')).toBe('desc');
  });

  it('encodes suite UID with carriage return', () => {
    writeHash({
      filterOnSuiteUid: 'Module A\rComponent B',
      filterOnStatus: '',
      search: '',
      sortBy: '',
      sortAscending: true
    });
    const parameters = new URLSearchParams(location.hash.slice(1));
    expect(parameters.get('suite')).toBe('Module A\rComponent B');
  });
});
