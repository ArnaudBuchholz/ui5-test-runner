import assert from 'node:assert/strict';
import { readFile, access, constants } from 'node:fs/promises';
import { join } from 'node:path';

export const loadReport = async (reportDir) => {
  const reportPath = join(reportDir, 'report.json');
  await access(reportPath, constants.R_OK);
  const reportText = await readFile(reportPath, 'utf8');
  const report = JSON.parse(reportText);
  assert.strictEqual(report.reportFormat, 'CTRF', 'report.json has CTRF format');
  assert.ok(report.results?.summary, 'report.json has results.summary');
  assert.ok(Array.isArray(report.results?.tests), 'report.json has results.tests array');
  return report;
};
