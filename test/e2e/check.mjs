import { parseArgs } from 'node:util';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { loadReport } from '../report.mjs';

try {
  const {
    values: {
      pages,
      coverage,
      'report-uncovered': coverageReportUncovered,
      'junit-xml-report': junitXmlReport,
      failed,
      summary
    },
    positionals
  } = parseArgs({
    allowPositionals: true,
    options: {
      pages: {
        type: 'string',
        default: ''
      },
      coverage: {
        type: 'boolean',
        default: false
      },
      'report-uncovered': {
        type: 'boolean',
        default: false
      },
      'junit-xml-report': {
        type: 'boolean',
        default: false
      },
      failed: {
        type: 'boolean',
        default: false
      },
      summary: {
        type: 'string',
        default: ''
      }
    }
  });

  const reportDir = positionals[0];
  const report = await loadReport(reportDir);

  const { RUNNER_EXIT_CODE } = process.env;
  if (failed) {
    assert.ok(report.results.summary.failed > 0, 'Job did not fail');
    assert.ok(!RUNNER_EXIT_CODE || RUNNER_EXIT_CODE !== '0', 'Runner did not fail');
  } else {
    assert.strictEqual(report.results.summary.failed, 0, 'Job did not succeed');
    assert.ok(!RUNNER_EXIT_CODE || RUNNER_EXIT_CODE === '0', 'Runner did not succeed');
  }

  if (pages) {
    const expectedCount = parseInt(pages);
    const pageUrls = new Set(
      report.results.tests.flatMap((test) => (test.suite ?? []).filter((s) => s.startsWith('http')))
    );
    assert.strictEqual(pageUrls.size, expectedCount, 'Number of test pages');
  }

  if (summary) {
    const [expectedPassed, expectedFailed, expectedTotal] = summary.split(',').map(Number);
    const { passed, failed, tests } = report.results.summary;
    assert.strictEqual(passed, expectedPassed, 'Number of tests passed');
    assert.strictEqual(failed, expectedFailed, 'Number of tests failed');
    assert.strictEqual(tests, expectedTotal, 'Total number of tests');
  }

  if (coverage) {
    const { coverageTempDir, coverageReportDir } = report;
    const mergedCoveragePath = join(coverageTempDir, 'merged/coverage.json');
    assert.strictEqual((await stat(mergedCoveragePath)).isFile(), true, 'Merged coverage file exists');
    const mergedCoverage = JSON.parse((await readFile(mergedCoveragePath)).toString());
    assert.ok(
      Object.keys(mergedCoverage).every((key) => {
        const { path } = mergedCoverage[key];
        return path === key;
      }),
      'Merged coverage file contains only absolute paths (key === path)'
    );
    assert.strictEqual((await stat(coverageReportDir)).isDirectory(), true, 'Coverage folder exists');
    assert.strictEqual(
      (await stat(join(coverageReportDir, 'lcov-report/index.html'))).isFile(),
      true,
      'Coverage HTML report exists'
    );
    const lcov = (await readFile(join(coverageReportDir, 'lcov.info'))).toString();
    assert.ok(lcov.length > 0, 'lcov data exists');
    if (coverageReportUncovered) {
      assert.ok(lcov.match(/\bcontroller(\/|\\)uncovered\.(js|ts)\b/), 'uncovered is reported');
    }
  }

  if (junitXmlReport) {
    assert.strictEqual((await stat(join(report.reportDir, 'junit.xml'))).isFile(), true, 'junit XML report exists');
  }
} catch (error) {
  console.error(error.message);
  process.exit(-1);
}
