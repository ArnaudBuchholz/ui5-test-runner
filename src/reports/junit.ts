import { FileSystem, Path } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import type { CommonTestReport, CTRFTest } from '../types/CommonTestReportFormat.js';

function xmlEscape(text: string): string {
  return text.replaceAll(/[<>&"]/g, (match) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[match]!);
}

function groupBySuite(tests: readonly CTRFTest[]): Map<string, CTRFTest[]> {
  const suitesByName = new Map<string, CTRFTest[]>();
  for (const test of tests) {
    const suiteName = test.suite?.[0] ?? '(root)';
    let bucket = suitesByName.get(suiteName);
    if (bucket === undefined) {
      bucket = [];
      suitesByName.set(suiteName, bucket);
    }
    bucket.push(test);
  }
  return suitesByName;
}

function testcaseLines(test: CTRFTest, suiteName: string): string[] {
  const classname = test.suite && test.suite.length > 1 ? test.suite.slice(1).join('.') : suiteName;
  const lines = [
    `    <testcase name="${xmlEscape(test.name)}" classname="${xmlEscape(classname)}" time="${(test.duration / 1000).toFixed(3)}">`
  ];
  if (test.status === 'skipped' || test.status === 'pending') {
    lines.push('      <skipped/>');
  } else if (test.status === 'failed') {
    const message = test.message ? ` message="${xmlEscape(test.message)}"` : '';
    lines.push(`      <failure${message}>`);
    if (test.trace) {
      lines.push(xmlEscape(test.trace));
    }
    lines.push('      </failure>');
  }
  const attachments = test.attachments ?? [];
  for (const attachment of attachments) {
    lines.push(`      <system-out>[[ATTACHMENT|${attachment.path}]]</system-out>`);
  }
  lines.push('    </testcase>');
  return lines;
}

function suiteLines(suiteName: string, suiteTests: CTRFTest[]): string[] {
  const failures = suiteTests.filter((t) => t.status === 'failed').length;
  const skipped = suiteTests.filter((t) => t.status === 'skipped' || t.status === 'pending').length;
  const time = (suiteTests.reduce((accumulator, t) => accumulator + t.duration, 0) / 1000).toFixed(3);
  return [
    `  <testsuite name="${xmlEscape(suiteName)}" tests="${suiteTests.length}" failures="${failures}" skipped="${skipped}" time="${time}">`,
    ...suiteTests.flatMap((test) => testcaseLines(test, suiteName)),
    '  </testsuite>'
  ];
}

export function generateJUnitReport(configuration: Configuration, report: CommonTestReport): void {
  if (!configuration.junitXmlFilename) {
    return;
  }

  const { summary, tests } = report.results;
  const time = ((summary.stop - summary.start) / 1000).toFixed(3);
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<testsuites name="ui5-test-runner" tests="${summary.tests}" failures="${summary.failed}" skipped="${summary.skipped}" time="${time}">`,
    ...[...groupBySuite(tests)].flatMap(([name, suiteTests]) => suiteLines(name, suiteTests)),
    '</testsuites>'
  ];

  FileSystem.writeFileSync(
    Path.join(configuration.reportDir, configuration.junitXmlFilename),
    lines.join('\n'),
    'utf8'
  );
}
