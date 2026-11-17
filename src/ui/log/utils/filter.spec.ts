import { describe, it, expect } from 'vitest';
import { buildFilterExpression, compileFilter, toggleFacet, isFacetSelected, facetValueKey } from './filter.js';
import type { FacetSelection } from './filter.js';

describe('buildFilterExpression', () => {
  describe('when existingFilter is empty', () => {
    it('returns the expression alone for a string value', () => {
      expect(buildFilterExpression('source', 'job', '===', '')).toBe('source === "job"');
    });

    it('returns the expression alone for a numeric value', () => {
      expect(buildFilterExpression('processId', 16_616, '===', '')).toBe('processId === 16616');
    });

    it('returns the expression alone for undefined (optional field)', () => {
      expect(buildFilterExpression('pageId', undefined, '===', '')).toBe('pageId === undefined');
    });

    it('returns the expression alone for a boolean value', () => {
      expect(buildFilterExpression('autorefresh', true, '===', '')).toBe('autorefresh === true');
    });

    it('uses !== operator when specified', () => {
      expect(buildFilterExpression('level', 'error', '!==', '')).toBe('level !== "error"');
    });
  });

  describe('when existingFilter is non-empty', () => {
    it('chains the new expression with && for string value', () => {
      const result = buildFilterExpression('source', 'job', '===', 'level === "info"');
      expect(result).toBe('level === "info" && source === "job"');
    });

    it('chains the new expression with && for numeric value', () => {
      const result = buildFilterExpression('processId', 42, '!==', 'source === "job"');
      expect(result).toBe('source === "job" && processId !== 42');
    });
  });

  describe('data field notation', () => {
    it('supports dot-notation field paths', () => {
      expect(buildFilterExpression('data.testName', 'open app', '===', '')).toBe('data.testName === "open app"');
    });
  });
});

const UNDEFINED_KEY = '\0undefined';

describe('facetValueKey', () => {
  it('maps undefined to a sentinel key', () => expect(facetValueKey(undefined)).toBe(UNDEFINED_KEY));
  it('stringifies other values', () => expect(facetValueKey(5)).toBe('5'));
});

describe('toggleFacet / isFacetSelected', () => {
  it('adds a value then reports it selected', () => {
    const next = toggleFacet(new Map(), 'source', 'job');
    expect(isFacetSelected(next, 'source', 'job')).toBe(true);
  });

  it('removes a value on second toggle and drops the empty field', () => {
    const once = toggleFacet(new Map(), 'source', 'job');
    const twice = toggleFacet(once, 'source', 'job');
    expect(isFacetSelected(twice, 'source', 'job')).toBe(false);
    expect(twice.has('source')).toBe(false);
  });

  it('does not mutate the input selection', () => {
    const original: FacetSelection = new Map();
    toggleFacet(original, 'source', 'job');
    expect(original.size).toBe(0);
  });
});

describe('compileFilter', () => {
  it('returns the free expression alone when no facets are selected', () => {
    expect(compileFilter(new Map(), 'level === "error"')).toBe('level === "error"');
  });

  it('returns empty string when nothing is set', () => {
    expect(compileFilter(new Map(), '')).toBe('');
  });

  it('quotes string sources and ORs multiple values of one field', () => {
    const selection = toggleFacet(toggleFacet(new Map(), 'source', 'job'), 'source', 'page');
    expect(compileFilter(selection, '')).toBe('(source === "job" || source === "page")');
  });

  it('keeps numeric pageId / processId values unquoted', () => {
    const selection = toggleFacet(new Map(), 'pageId', '5');
    expect(compileFilter(selection, '')).toBe('pageId === 5');
  });

  it('compares level by its string name', () => {
    const selection = toggleFacet(new Map(), 'level', 'error');
    expect(compileFilter(selection, '')).toBe('level === "error"');
  });

  it('handles the undefined sentinel as `=== undefined`', () => {
    const selection = toggleFacet(new Map(), 'pageId', UNDEFINED_KEY);
    expect(compileFilter(selection, '')).toBe('pageId === undefined');
  });

  it('ANDs facet fields and the free expression together', () => {
    const selection = toggleFacet(toggleFacet(new Map(), 'source', 'job'), 'pageId', '5');
    expect(compileFilter(selection, 'level === "error"')).toBe('source === "job" && pageId === 5 && level === "error"');
  });
});
