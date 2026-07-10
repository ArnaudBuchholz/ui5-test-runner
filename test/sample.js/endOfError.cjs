const { homedir } = require('node:os');
const { join } = require('node:path');

const [,, reportDir] = process.argv;
const report = require(join(reportDir, 'report.json'));
const testsuite = report.extra.configuration.testsuite;

const checks = {
  'test/no-testsuite.qunit.html': () => {
    console.log('The missing suite should appear in the report');
  }
}

const check = checks[testsuite];
if (check) {
  check();
} else {
  console.error('No check function for this testsuite');
}
