import { describe, it, expect } from 'vitest';
import {
  translateToCoverageFilter,
  isCoverageKeyKept,
  recordSuitePages,
  getRecordedSuitePages,
  clearSuitePages
} from './coverageFilter.js';
import type { SuitePage } from '../../../types/AgentState.js';
import type { Configuration } from '../../../configuration/Configuration.js';

const TODO_PAGE: SuitePage = {
  url: 'http://localhost/test/opaTests.html',
  coverage: { only: 'sap/ui/demo/todo/', never: 'test-resources/sap/ui/demo/todo/' },
  loaderPaths: { 'sap/ui/demo/todo': '../' }
};

describe('translateToCoverageFilter', () => {
  it('maps an only resource prefix to a cwd-relative include prefix via loader paths', () => {
    // 'sap/ui/demo/todo' → '../' from the page dir 'test/' resolves to the cwd root ('').
    expect(
      translateToCoverageFilter([{ ...TODO_PAGE, coverage: { only: 'sap/ui/demo/todo/' } }]).include
    ).toStrictEqual(['']);
  });

  it('maps a test-resources never prefix to the page directory', () => {
    expect(translateToCoverageFilter([TODO_PAGE]).exclude).toStrictEqual(['test/']);
  });

  it('omits include when a page has no only (include-all)', () => {
    const page: SuitePage = { ...TODO_PAGE, coverage: { never: 'test-resources/sap/ui/demo/todo/' } };
    expect(translateToCoverageFilter([page]).include).toBeUndefined();
  });

  it('unions include prefixes across pages', () => {
    const a: SuitePage = {
      url: 'http://localhost/a/x.html',
      coverage: { only: 'ns/a/' },
      loaderPaths: { 'ns/a': '.' }
    };
    const b: SuitePage = {
      url: 'http://localhost/b/y.html',
      coverage: { only: 'ns/b/' },
      loaderPaths: { 'ns/b': '.' }
    };
    expect(translateToCoverageFilter([a, b]).include).toStrictEqual(['a/', 'b/']);
  });

  it('intersects never prefixes across pages', () => {
    const a: SuitePage = { ...TODO_PAGE, coverage: { never: 'test-resources/sap/ui/demo/todo/' } };
    const b: SuitePage = { ...TODO_PAGE, url: 'http://localhost/test/unit.html', coverage: { never: 'other/' } };
    // b's never maps to nothing (no loader prefix, not test-resources), so the intersection is empty.
    expect(translateToCoverageFilter([a, b]).exclude).toStrictEqual([]);
  });

  it('ignores pages that declare no coverage', () => {
    expect(translateToCoverageFilter([{ url: 'http://localhost/test/x.html' }])).toStrictEqual({ exclude: [] });
  });

  it('expands array only patterns', () => {
    const page: SuitePage = {
      url: 'http://localhost/x.html',
      coverage: { only: ['test-resources/a/', 'test-resources/b/'] }
    };
    // Both map to the page's own (root) directory via the test-resources convention.
    expect(translateToCoverageFilter([page]).include).toStrictEqual(['']);
  });

  it('drops an only prefix that matches no loader path and is not under test-resources', () => {
    const page: SuitePage = { url: 'http://localhost/test/x.html', coverage: { only: 'unmapped/ns/' } };
    // No prefix is produced, so include stays empty and is omitted.
    expect(translateToCoverageFilter([page])).toStrictEqual({ exclude: [] });
  });

  it('maps a test-resources never on a root page to the whole tree', () => {
    const page: SuitePage = { url: 'http://localhost/x.html', coverage: { never: 'test-resources/ns/' } };
    expect(translateToCoverageFilter([page]).exclude).toStrictEqual(['']);
  });

  it('prefers the longest matching loader path prefix', () => {
    const page: SuitePage = {
      url: 'http://localhost/app/sub/x.html',
      coverage: { only: 'ns/deep/Thing' },
      loaderPaths: { ns: '../../root', 'ns/deep': '.' }
    };
    // 'ns/deep' is the longer match → resolves to the page's own dir 'app/sub'.
    expect(translateToCoverageFilter([page]).include).toStrictEqual(['app/sub/']);
  });
});

describe('isCoverageKeyKept', () => {
  it('drops a key matching an exclude prefix', () => {
    expect(isCoverageKeyKept('test/unit/unitTests.qunit.js', { exclude: ['test/'] })).toBe(false);
  });

  it('keeps a key not matching any exclude prefix', () => {
    expect(isCoverageKeyKept('controller/App.controller.js', { exclude: ['test/'] })).toBe(true);
  });

  it('keeps every key when include is the root prefix', () => {
    expect(isCoverageKeyKept('controller/App.controller.js', { include: [''], exclude: [] })).toBe(true);
  });

  it('drops a key outside the include prefixes', () => {
    expect(isCoverageKeyKept('other/File.js', { include: ['controller/'], exclude: [] })).toBe(false);
  });
});

describe('recordSuitePages', () => {
  it('accumulates only the pages that declare coverage, scoped to the configuration', () => {
    const configuration = {} as Configuration;
    recordSuitePages(configuration, [{ url: 'a.html', coverage: { only: 'ns/' } }, { url: 'b.html' }]);
    recordSuitePages(configuration, [{ url: 'c.html', coverage: { never: 'test-resources/x/' } }]);
    expect(getRecordedSuitePages(configuration)).toStrictEqual([
      { url: 'a.html', coverage: { only: 'ns/' } },
      { url: 'c.html', coverage: { never: 'test-resources/x/' } }
    ]);
  });

  it('returns an empty list for a configuration with no recorded pages', () => {
    expect(getRecordedSuitePages({} as Configuration)).toStrictEqual([]);
  });

  it('clears the recorded pages for a configuration', () => {
    const configuration = {} as Configuration;
    recordSuitePages(configuration, [{ url: 'a.html', coverage: { only: 'ns/' } }]);
    clearSuitePages(configuration);
    expect(getRecordedSuitePages(configuration)).toStrictEqual([]);
  });
});
