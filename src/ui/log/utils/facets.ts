import type { InternalLogAttributes, LogLevel } from '../../../platform/logger/types.js';
import { facetValueKey, FACET_FIELDS } from './filter.js';
import type { FacetField } from './filter.js';

const WARN: LogLevel = 2;
const ERROR: LogLevel = 3;

export type FacetCount = {
  /** Stable key (matches selection keys). */
  key: string;
  /** Human label. */
  label: string;
  /** Raw value, for building a filter clause. */
  value: unknown;
  count: number;
};

export type Facets = Record<FacetField, FacetCount[]>;

export type IssueSummary = {
  errors: number;
  warns: number;
  /** Pages (by pageId) that have at least one error/fatal or assert entry. */
  failingPages: number[];
};

function fieldValue(log: InternalLogAttributes, field: FacetField): unknown {
  return field === 'level' ? log.level : (log as unknown as Record<string, unknown>)[field];
}

function labelFor(field: FacetField, value: unknown): string {
  if (value === undefined) {
    return 'none';
  }
  if (field === 'level') {
    return ['debug', 'info', 'warn', 'error', 'fatal'][value as LogLevel] ?? String(value);
  }
  return String(value);
}

/** Count occurrences of each distinct value per facet field, across the given logs. */
export function computeFacets(logs: ReadonlyArray<InternalLogAttributes>): Facets {
  const buckets: Record<FacetField, Map<string, FacetCount>> = {
    source: new Map(),
    level: new Map(),
    pageId: new Map(),
    processId: new Map()
  };
  for (const log of logs) {
    for (const field of FACET_FIELDS) {
      const value = fieldValue(log, field);
      const map = buckets[field];
      const key = field === 'level' ? labelFor(field, value) : facetValueKey(value);
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, { key, label: labelFor(field, value), value, count: 1 });
      }
    }
  }
  const sortByCount = (a: FacetCount, b: FacetCount) => b.count - a.count;
  return {
    source: [...buckets.source.values()].toSorted(sortByCount),
    level: [...buckets.level.values()].toSorted((a, b) => (b.value as number) - (a.value as number)),
    pageId: [...buckets.pageId.values()].toSorted(sortByCount),
    processId: [...buckets.processId.values()].toSorted(sortByCount)
  };
}

/** Derive the triage summary: error/warn counts and which pages look broken. */
export function computeIssues(logs: ReadonlyArray<InternalLogAttributes>): IssueSummary {
  let errors = 0;
  let warns = 0;
  const failing = new Set<number>();
  for (const log of logs) {
    if (log.level >= ERROR) {
      errors++;
    } else if (log.level === WARN) {
      warns++;
    }
    const isBad = log.level >= ERROR || log.source === 'assert';
    if (isBad && typeof log.pageId === 'number') {
      failing.add(log.pageId);
    }
  }
  return { errors, warns, failingPages: [...failing].toSorted((a, b) => a - b) };
}
