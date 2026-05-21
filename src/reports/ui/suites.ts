import type { CTRFTest } from '../../types/CommonTestReportFormat.js';
import type { Suite } from './types.js';

export const SUITE_SEPARATOR = '\r';
export const NO_SUITE_ID = '';
export const NO_SUITE_LABEL = 'No suite';
export const NO_SUITE = {
  uid: NO_SUITE_ID,
  label: NO_SUITE_LABEL,
  suites: []
} as const satisfies Suite;

export const findSuite = (suites: Suite[], suiteUid: string): Suite | undefined => {
  for (const suite of suites) {
    if (suite.uid === suiteUid) {
      return suite;
    }
  }
  return undefined;
};

export const extractUrlLabel = (url: string): string => {
  const parsed = new URL(url);
  const test = parsed.searchParams.get('test');
  const testsuite = parsed.searchParams.get('testsuite');
  const file = parsed.pathname.split('/').findLast(Boolean);
  return test || testsuite || file || url;
};

const isValidSuite = (
  suiteArray: readonly string[] | undefined,
  suites: Suite[]
): suiteArray is readonly [string, ...string[]] => {
  if (!suiteArray || suiteArray.length === 0) {
    if (!findSuite(suites, NO_SUITE_ID)) {
      suites.push(NO_SUITE);
    }
    return false;
  }
  return true;
};

export const buildSuites = (tests: CTRFTest[]): Suite[] => {
  const root: Suite = {
    uid: '',
    label: '',
    suites: []
  };
  for (const test of tests) {
    const { suite: suiteArray } = test;
    if (isValidSuite(suiteArray, root.suites)) {
      let parent = root;
      const suitePath = [];
      for (const element of suiteArray) {
        const suiteId = element;
        suitePath.push(suiteId);
        const suiteUid = suitePath.join(SUITE_SEPARATOR);
        let suite = findSuite(parent.suites, suiteUid);
        if (!suite) {
          suite = {
            uid: suiteUid,
            label: /^https?:/.test(suiteId) ? extractUrlLabel(suiteId) : suiteId,
            suites: []
          };
          parent.suites.push(suite);
        }
        parent = suite;
      }
    }
  }
  return root.suites;
};
