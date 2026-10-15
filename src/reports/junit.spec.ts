import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'node:module';
import { FileSystem, Path } from '../platform/index.js';
import { generateJUnitReport } from './junit.js';
import type { Configuration } from '../configuration/Configuration.js';
import type { CommonTestReport } from '../types/CommonTestReportFormat.js';

const REPORT_DIR = '/output';

const BASE_CONFIGURATION = {
  reportDir: REPORT_DIR,
  junitXmlFilename: 'junit.xml'
} as Configuration;

const NO_JUNIT_CONFIGURATION = {
  reportDir: REPORT_DIR,
  junitXmlFilename: ''
} as Configuration;

const makeReport = (tests: CommonTestReport['results']['tests']): CommonTestReport => ({
  reportFormat: 'CTRF',
  specVersion: 'pre-1.0',
  results: {
    tool: { name: 'ui5-test-runner' },
    summary: {
      tests: tests.length,
      passed: tests.filter((t) => t.status === 'passed').length,
      failed: tests.filter((t) => t.status === 'failed').length,
      skipped: tests.filter((t) => t.status === 'skipped').length,
      pending: tests.filter((t) => t.status === 'pending').length,
      other: tests.filter((t) => t.status === 'other').length,
      start: 1000,
      stop: 3000,
      duration: 2000
    },
    tests
  }
});

const getWrittenXml = (): string => {
  const calls = vi.mocked(FileSystem.writeFileSync).mock.calls;
  const call = calls.find(([p]) => String(p).endsWith('.xml'));
  const content = call?.[1];
  return typeof content === 'string' ? content : '';
};

const require = createRequire(import.meta.url);

const { JSDOM } = require('jsdom') as { JSDOM: new (html: string, options: object) => unknown };

const parseXml = (xml: string) => {
  const jsdom = new JSDOM(xml, { contentType: 'text/xml' }) as {
    window: { document: Document; XPathResult: typeof XPathResult };
  };
  const { document, XPathResult: XR } = jsdom.window;
  const xpath = (expression: string): string[] => {
    const result = document.evaluate(expression, document, null, XR.ORDERED_NODE_SNAPSHOT_TYPE, null);
    return Array.from({ length: result.snapshotLength }, (_, index) => result.snapshotItem(index)?.nodeValue ?? '');
  };
  return { doc: document, xpath };
};

beforeEach(() => {
  vi.mocked(FileSystem.writeFileSync).mockImplementation(() => {});
});

describe('generateJUnitReport()', () => {
  describe('when junitXmlFilename is empty', () => {
    it('does not write any file', () => {
      generateJUnitReport(NO_JUNIT_CONFIGURATION, makeReport([]));
      expect(FileSystem.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('output path', () => {
    it('writes to reportDir/<junitXmlFilename>', () => {
      generateJUnitReport(BASE_CONFIGURATION, makeReport([]));
      expect(FileSystem.writeFileSync).toHaveBeenCalledWith(
        Path.join(REPORT_DIR, 'junit.xml'),
        expect.any(String),
        'utf8'
      );
    });

    it('respects a custom filename', () => {
      const config = { reportDir: REPORT_DIR, junitXmlFilename: 'results.xml' } as Configuration;
      generateJUnitReport(config, makeReport([]));
      expect(FileSystem.writeFileSync).toHaveBeenCalledWith(
        Path.join(REPORT_DIR, 'results.xml'),
        expect.any(String),
        'utf8'
      );
    });
  });

  describe('XML structure', () => {
    it('produces a valid XML document', () => {
      generateJUnitReport(BASE_CONFIGURATION, makeReport([]));
      const { doc } = parseXml(getWrittenXml());
      expect(doc.querySelector('parsererror')).toBeNull();
    });

    it('has a testsuites root element with summary attributes', () => {
      generateJUnitReport(BASE_CONFIGURATION, makeReport([]));
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('/testsuites/@tests')).toEqual(['0']);
      expect(xpath('/testsuites/@failures')).toEqual(['0']);
      expect(xpath('/testsuites/@skipped')).toEqual(['0']);
      expect(xpath('/testsuites/@time')).toEqual(['2.000']);
    });
  });

  describe('test grouping', () => {
    it('groups tests into testsuite elements by suite[0]', () => {
      const report = makeReport([
        { name: 'test A', status: 'passed', duration: 100, suite: ['Suite 1'] },
        { name: 'test B', status: 'passed', duration: 200, suite: ['Suite 2'] }
      ]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('/testsuites/testsuite/@name')).toEqual(['Suite 1', 'Suite 2']);
    });

    it('groups tests without a suite under (root)', () => {
      const report = makeReport([{ name: 'rootless', status: 'passed', duration: 0 }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('/testsuites/testsuite/@name')).toEqual(['(root)']);
    });

    it('uses suite path without the first element as classname', () => {
      const report = makeReport([{ name: 'deep test', status: 'passed', duration: 0, suite: ['Module', 'Sub'] }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/@classname')).toEqual(['Sub']);
    });

    it('uses the suite name as classname when suite has only one element', () => {
      const report = makeReport([{ name: 'shallow test', status: 'passed', duration: 0, suite: ['Module'] }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/@classname')).toEqual(['Module']);
    });
  });

  describe('test status mapping', () => {
    it('emits no child element for a passed test', () => {
      const report = makeReport([{ name: 'ok', status: 'passed', duration: 500, suite: ['S'] }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/skipped')).toHaveLength(0);
      expect(xpath('//testcase/failure')).toHaveLength(0);
    });

    it('emits <skipped/> for a skipped test', () => {
      const report = makeReport([{ name: 'skip me', status: 'skipped', duration: 0, suite: ['S'] }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/skipped')).toHaveLength(1);
    });

    it('emits <skipped/> for a pending test', () => {
      const report = makeReport([{ name: 'todo', status: 'pending', duration: 0, suite: ['S'] }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/skipped')).toHaveLength(1);
    });

    it('emits <failure> for a failed test', () => {
      const report = makeReport([{ name: 'bad', status: 'failed', duration: 0, suite: ['S'] }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/failure')).toHaveLength(1);
    });

    it('includes message attribute on <failure> when present', () => {
      const report = makeReport([
        { name: 'bad', status: 'failed', duration: 0, suite: ['S'], message: 'Expected 1 to be 2' }
      ]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/failure/@message')).toEqual(['Expected 1 to be 2']);
    });

    it('includes trace content inside <failure> when present', () => {
      const report = makeReport([{ name: 'bad', status: 'failed', duration: 0, suite: ['S'], trace: 'at line 42' }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/failure/text()').map((s) => s.trim())).toEqual(['at line 42']);
    });
  });

  describe('timing', () => {
    it('converts test duration from ms to seconds', () => {
      const report = makeReport([{ name: 't', status: 'passed', duration: 1500, suite: ['S'] }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/@time')).toEqual(['1.500']);
    });
  });

  describe('XML escaping', () => {
    it('round-trips special characters in test name', () => {
      const report = makeReport([{ name: 'a < b & c > d "e"', status: 'passed', duration: 0, suite: ['S'] }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/@name')).toEqual(['a < b & c > d "e"']);
    });

    it('round-trips special characters in suite name', () => {
      const report = makeReport([{ name: 't', status: 'passed', duration: 0, suite: ['A & B'] }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('/testsuites/testsuite/@name')).toEqual(['A & B']);
    });

    it('round-trips special characters in failure message', () => {
      const report = makeReport([{ name: 't', status: 'failed', duration: 0, suite: ['S'], message: 'got <null>' }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/failure/@message')).toEqual(['got <null>']);
    });
  });

  describe('attachments', () => {
    it('emits a system-out element with [[ATTACHMENT|path]] for each attachment', () => {
      const report = makeReport([
        {
          name: 'failing with screenshot',
          status: 'failed',
          duration: 0,
          suite: ['S'],
          attachments: [{ name: 'failure screenshot', contentType: 'image/png', path: '1-failure.png' }]
        }
      ]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/system-out/text()')).toEqual(['[[ATTACHMENT|1-failure.png]]']);
    });

    it('emits no system-out element when there are no attachments', () => {
      const report = makeReport([{ name: 't', status: 'passed', duration: 0, suite: ['S'] }]);
      generateJUnitReport(BASE_CONFIGURATION, report);
      const { xpath } = parseXml(getWrittenXml());
      expect(xpath('//testcase/system-out')).toHaveLength(0);
    });
  });
});
