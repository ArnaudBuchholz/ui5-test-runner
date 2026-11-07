import type { AgentState, SuitePage } from '../types/AgentState.js';
import { state } from './state.js';
import { log } from './log.js';
import { isObject, isStringRecord } from '../utils/shared/object.js';
import { isStringOrStringArray } from '../utils/shared/string.js';

type SuitePageCoverage = NonNullable<SuitePage['coverage']>;

// Extracts a validated pattern field; logs an error when present but malformed, stays silent when absent.
const extractPattern = (
  owner: Record<string, unknown>,
  key: string,
  context: string
): string | string[] | undefined => {
  if (!(key in owner)) {
    return undefined;
  }
  if (isStringOrStringArray(owner[key])) {
    return owner[key];
  }
  log.error(`invalid ${context}.${key}: expected a string or string array`);
  return undefined;
};

const extractCoverage = (config: unknown): SuitePageCoverage | undefined => {
  if (!isObject(config) || !('coverage' in config)) {
    return undefined;
  }
  const { coverage } = config;
  if (!isObject(coverage)) {
    log.error('invalid coverage: expected an object');
    return undefined;
  }
  let result: SuitePageCoverage | undefined;
  const only = extractPattern(coverage, 'only', 'coverage');
  const never = extractPattern(coverage, 'never', 'coverage');
  if (only !== undefined) {
    result ||= {};
    result.only = only;
  }
  if (never !== undefined) {
    result ||= {};
    result.never = never;
  }
  return result;
};

const extractLoaderPaths = (config: unknown): Record<string, string> | undefined => {
  if (!isObject(config) || !('loader' in config)) {
    return undefined;
  }
  const { loader } = config;
  if (!isObject(loader) || !('paths' in loader)) {
    return undefined;
  }
  if (isStringRecord(loader['paths'])) {
    return loader['paths'];
  }
  log.error('invalid loader.paths: expected a record of strings');
  return undefined;
};

export class JsUnitTestSuite {
  // eslint-disable-next-line sonarjs/public-static-readonly -- to enable testing
  static pages: SuitePage[] | undefined;

  constructor() {
    log('custom JsUnitTestSuite built');
    JsUnitTestSuite.pages = [];
  }

  addTestPage(url: string, config?: unknown) {
    log(`addTestPage('${url}', ${JSON.stringify(config)})`);
    const coverage = extractCoverage(config);
    const loaderPaths = extractLoaderPaths(config);
    const page: SuitePage = { url };
    if (coverage) {
      page.coverage = coverage;
    }
    if (loaderPaths) {
      page.loaderPaths = loaderPaths;
    }
    JsUnitTestSuite.pages!.push(page);
  }
}

Object.assign(window, { jsUnitTestSuite: JsUnitTestSuite });

export const suite = async () => {
  log('executing suite');
  await window.suite?.();
  log('suite executed');
  const newState: AgentState = JsUnitTestSuite.pages
    ? {
        done: true,
        type: 'suite',
        pages: JsUnitTestSuite.pages
      }
    : {
        done: true,
        type: 'unknown'
      };
  Object.assign(state, newState);
};
