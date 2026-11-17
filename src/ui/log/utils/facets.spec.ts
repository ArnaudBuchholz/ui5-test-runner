import { describe, it, expect } from 'vitest';
import { computeFacets, computeIssues } from './facets.js';
import type { InternalLogAttributes } from '../../../platform/logger/types.js';

function log(partial: Partial<InternalLogAttributes>): InternalLogAttributes {
  return {
    timestamp: 1,
    level: 1,
    processId: 100,
    threadId: 0,
    isMainThread: true,
    source: 'job',
    message: 'm',
    ...partial
  } as InternalLogAttributes;
}

const LOGS: InternalLogAttributes[] = [
  log({ source: 'job', level: 1, processId: 100, pageId: 1 }),
  log({ source: 'job', level: 2, processId: 100, pageId: 1 }),
  log({ source: 'page', level: 3, processId: 101, pageId: 2 }),
  log({ source: 'assert', level: 1, processId: 101, pageId: 3 }),
  log({ source: 'metric', level: 0, processId: 100 })
];

describe('computeFacets', () => {
  it('counts distinct source values, most frequent first', () => {
    const { source } = computeFacets(LOGS);
    expect(source[0]).toMatchObject({ value: 'job', count: 2 });
    expect(source.map((s) => s.value)).toContain('metric');
  });

  it('orders levels by severity descending', () => {
    const { level } = computeFacets(LOGS);
    expect(level.map((l) => l.value)).toEqual([3, 2, 1, 0]);
  });

  it('labels a missing pageId as "none"', () => {
    const { pageId } = computeFacets(LOGS);
    expect(pageId.some((p) => p.label === 'none')).toBe(true);
  });

  it('returns empty arrays for no logs', () => {
    expect(computeFacets([])).toEqual({ source: [], level: [], pageId: [], processId: [] });
  });
});

describe('computeIssues', () => {
  it('counts errors (level >= 3) and warnings (level 2)', () => {
    const { errors, warns } = computeIssues(LOGS);
    expect(errors).toBe(1);
    expect(warns).toBe(1);
  });

  it('marks a page failing when it has an error or an assert', () => {
    const { failingPages } = computeIssues(LOGS);
    expect(failingPages).toEqual([2, 3]);
  });

  it('ignores entries without a numeric pageId', () => {
    const { failingPages } = computeIssues([log({ source: 'assert', level: 3 })]);
    expect(failingPages).toEqual([]);
  });
});
