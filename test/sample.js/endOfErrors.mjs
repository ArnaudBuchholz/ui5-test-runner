import { loadReport } from '../report.mjs';
import assert from 'node:assert/strict';

const [, , reportDir] = process.argv;
const report = await loadReport(reportDir);
const testsuite = report.extra.configuration.testsuite;

const checks = {
  'test/no-testsuite.qunit.html': () => {
    console.log('The missing suite should appear in the report');
    assert.strictEqual(report.results.tests.length, 1, 'a test report exists');
  }
};

const check = checks[testsuite];
if (check) {
  check();
} else {
  console.error('No check function for this testsuite');
}
