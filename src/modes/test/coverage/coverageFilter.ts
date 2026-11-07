import type { SuitePage } from '../../../types/AgentState.js';
import type { Configuration } from '../../../configuration/Configuration.js';

/** cwd-relative path prefixes derived from the suite's coverage only/never patterns (simple, no globs) */
export type CoverageFilter = { include?: string[]; exclude: string[] };

const runFilters = new WeakMap<Configuration, SuitePage[]>();

export const recordSuitePages = (configuration: Configuration, pages: SuitePage[]): void => {
  const recorded = runFilters.get(configuration) ?? [];
  runFilters.set(configuration, [...recorded, ...pages.filter((page) => page.coverage)]);
};

export const getRecordedSuitePages = (configuration: Configuration): SuitePage[] => runFilters.get(configuration) ?? [];

export const clearSuitePages = (configuration: Configuration): void => {
  runFilters.delete(configuration);
};

const toArray = (pattern: string | string[]): string[] => (Array.isArray(pattern) ? pattern : [pattern]);

const pageDirectory = (pageUrl: string): string => {
  const { pathname } = new URL(pageUrl, 'http://localhost/');
  return pathname.slice(1, pathname.lastIndexOf('/') + 1); // leading-slash stripped, trailing slash kept
};

const matchLoaderPrefix = (resource: string, loaderPaths: Record<string, string>): string | undefined => {
  const prefixes = Object.keys(loaderPaths).toSorted((a, b) => b.length - a.length);
  return prefixes.find((prefix) => resource === prefix || resource.startsWith(`${prefix}/`));
};

const normalizeRelative = (base: string, relative: string): string => {
  const segments = `${base}${relative}`.split('/');
  const stack: string[] = [];
  for (const segment of segments) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      stack.pop();
    } else {
      stack.push(segment);
    }
  }
  return stack.join('/');
};

// Translate a single UI5 resource prefix to a cwd-relative path prefix (empty string = the cwd root,
// i.e. everything). Returns undefined when the resource prefix cannot be mapped below cwd.
const resourceToPrefix = (resource: string, page: SuitePage): string | undefined => {
  const directory = pageDirectory(page.url);
  const loaderPaths = page.loaderPaths ?? {};
  const prefix = matchLoaderPrefix(resource, loaderPaths);
  if (prefix !== undefined) {
    const mappedDirectory = normalizeRelative(directory, loaderPaths[prefix]!);
    return mappedDirectory === '' ? '' : `${mappedDirectory}/`;
  }
  // The `test-resources/<ns>/` form is the UI5 convention for a page's own test tree, served from the
  // page directory. Map it to that directory relative to cwd.
  return resource.startsWith('test-resources/') ? directory : undefined;
};

const resourcesToPrefixes = (patterns: string | string[], page: SuitePage): string[] =>
  toArray(patterns)
    .map((pattern) => resourceToPrefix(pattern, page))
    .filter((prefix): prefix is string => prefix !== undefined);

const intersect = (lists: string[][]): string[] => {
  if (lists.length === 0) {
    return [];
  }
  let result = lists[0]!;
  for (const list of lists.slice(1)) {
    result = result.filter((prefix) => list.includes(prefix));
  }
  return result;
};

export const translateToCoverageFilter = (pages: SuitePage[]): CoverageFilter => {
  const withCoverage = pages.filter((page) => page.coverage);
  const includeSet = new Set<string>();
  const neverLists: string[][] = [];
  let isAnyWithoutOnly = false;
  for (const page of withCoverage) {
    const { only, never } = page.coverage!;
    if (only === undefined) {
      isAnyWithoutOnly = true;
    } else {
      for (const prefix of resourcesToPrefixes(only, page)) {
        includeSet.add(prefix);
      }
    }
    neverLists.push(never === undefined ? [] : resourcesToPrefixes(never, page));
  }
  const filter: CoverageFilter = { exclude: intersect(neverLists) };
  if (!isAnyWithoutOnly && includeSet.size > 0) {
    filter.include = [...includeSet];
  }
  return filter;
};

export const isCoverageKeyKept = (relativePath: string, filter: CoverageFilter): boolean => {
  const isExcluded = filter.exclude.some((prefix) => relativePath.startsWith(prefix));
  const isIncluded = filter.include === undefined || filter.include.some((prefix) => relativePath.startsWith(prefix));
  return !isExcluded && isIncluded;
};
