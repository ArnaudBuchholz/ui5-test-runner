import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import type { Suite } from './types.js';

export const SUITE_SEPARATOR = '||';

export const findSuite = (suites: Suite[], suiteId: string): Suite | undefined => {
  for (const suite of suites) {
    if (suite.id === suiteId) {
      return suite;
    }
  }
  return undefined;
};

export const buildSuites = (tests: CommonTestReport['results']['tests']): Suite[] => {
  const results: Suite[] = [];
  for (const test of tests) {
    const { suite } = test;
    if (!suite) {
      let noSuite = findSuite(results, '');
      if (!noSuite) {
        noSuite = {
            id: '',
            label: 'No suite'
        };
        results.push(noSuite);
      }
      continue;
    }
    let suites = results;
    for (let index = 0; index < suite.length; ++index) {
      const existingSuite = findSuite(suites, suite[index]!);
      
      if (existingSuite && index + 1 < suite.length) {
        existingSuite.suites ??= [];
        suites = existingSuite.suites;
      } else {
        const newSuite = {
          id: '',
          label: 'TO BE DETERMINED'
        }
        suites.push(newSuite);

      }
    }

  }
  return results;
};
