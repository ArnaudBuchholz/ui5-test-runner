import type { LogLevel } from '../../../platform/logger/types.js';
import { levelName } from './format.js';

/**
Compose a single comparison clause against a log field, in the `punyexpr` dialect the
server understands: strings are double-quoted, everything else is stringified, and the
`level` field compares against its string name (see `LogStorage.buildFilterExpression`).
*/
export function buildFilterExpression(
  field: string,
  value: unknown,
  op: '===' | '!==',
  existingFilter: string
): string {
  const formatted = typeof value === 'string' ? `"${value}"` : String(value);
  const expression = `${field} ${op} ${formatted}`;
  return existingFilter ? `${existingFilter} && ${expression}` : expression;
}

/**
A facet selection: which values of a field the user has included. `level` holds string
names (`"error"`), all other fields hold their raw values. An empty set means "no
restriction on this field".
*/
export type FacetSelection = Map<string, Set<string>>;

export const FACET_FIELDS = ['source', 'level', 'pageId', 'processId'] as const;
export type FacetField = (typeof FACET_FIELDS)[number];

/** Stable string key for a facet value, so selections survive re-render. */
export function facetValueKey(value: unknown): string {
  return value === undefined ? '\0undefined' : String(value);
}

function clauseForValue(field: string, key: string): string {
  if (key === '\0undefined') {
    return `${field} === undefined`;
  }
  if (field === 'level') {
    return `${field} === "${key}"`;
  }
  // pageId / processId are numeric; source is a string.
  const isNumericField = field === 'pageId' || field === 'processId';
  return isNumericField ? `${field} === ${key}` : `${field} === "${key}"`;
}

/** OR the selected values of one field, wrapping in parentheses when more than one. */
function clauseForField(field: string, keys: Set<string>): string | undefined {
  if (keys.size === 0) {
    return undefined;
  }
  const parts = [...keys].map((key) => clauseForValue(field, key));
  return parts.length > 1 ? `(${parts.join(' || ')})` : parts[0];
}

/**
Compile facet selections plus an optional free-text expression into a single punyexpr
string. Selections within a field are OR-ed; fields and the free expression are AND-ed.
*/
export function compileFilter(selection: FacetSelection, freeExpression: string): string {
  const clauses: string[] = [];
  for (const field of FACET_FIELDS) {
    const keys = selection.get(field);
    const clause = keys && clauseForField(field, keys);
    if (clause) {
      clauses.push(clause);
    }
  }
  const trimmed = freeExpression.trim();
  if (trimmed) {
    clauses.push(trimmed);
  }
  return clauses.join(' && ');
}

/** Toggle one value of a facet field in the selection, returning a new selection. */
export function toggleFacet(selection: FacetSelection, field: FacetField, valueKey: string): FacetSelection {
  const next: FacetSelection = new Map([...selection].map(([key, set]) => [key, new Set(set)]));
  const set = next.get(field) ?? new Set<string>();
  if (set.has(valueKey)) {
    set.delete(valueKey);
  } else {
    set.add(valueKey);
  }
  if (set.size === 0) {
    next.delete(field);
  } else {
    next.set(field, set);
  }
  return next;
}

export function isFacetSelected(selection: FacetSelection, field: FacetField, valueKey: string): boolean {
  return selection.get(field)?.has(valueKey) ?? false;
}

/** The level names, severe first — used by the "level ≥" quick filter. */
export const LEVEL_NAMES_BY_SEVERITY: ReadonlyArray<{ level: LogLevel; name: string }> = (
  [4, 3, 2, 1, 0] as LogLevel[]
).map((level) => ({ level, name: levelName(level) }));
