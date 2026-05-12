import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import type { Suite } from './types.js';

export const SUITE_SEPARATOR = '\r';
export const NO_SUITE = '';
export const NO_SUITE_LABEL = 'No suite';

export const findSuite = (suites: Suite[], suiteUid: string): Suite | undefined => {
  for (const suite of suites) {
    if (suite.uid === suiteUid) {
      return suite;
    }
  }
  return undefined;
};

export const buildSuites = (tests: CommonTestReport['results']['tests']): Suite[] => {
  const root: Suite = {
    uid: '',
    label: '',
    suites: [],
  };
  for (const test of tests) {
    const { suite: suiteArray } = test;
    if (!suiteArray || suiteArray.length === 0) {
      let noSuite = findSuite(root.suites, NO_SUITE);
      if (!noSuite) {
        noSuite = {
            uid: NO_SUITE,
            label: NO_SUITE_LABEL,
            suites: []
        };
        root.suites.push(noSuite);
      }
      continue;
    }
    let parent = root;
    let suiteUid = '';
    for (let index = 0; index < suiteArray.length; ++index) {
      const suiteId = suiteArray[index]!;
      if (!suiteUid) {
        suiteUid = suiteId;
      } else {
        suiteUid += SUITE_SEPARATOR + suiteId;
      }
      let suite = findSuite(parent.suites, suiteUid);
      if (!suite) {
        suite = {
          uid: suiteUid,
          label: suiteId.match(/^https?:/) ? 'TO BE DETERMINED' : suiteId,
          suites: []
        };
        parent.suites.push(suite);
      }
      parent = suite;
    }
  }
  return root.suites;
};
