import assert from 'node:assert/strict';
import { readFile, access, constants } from 'node:fs/promises';
import { join } from 'node:path';

export const loadReport = async (reportDir) => {
  const reportPath = join(reportDir, 'report.json');
  await access(reportPath, constants.R_OK);
  const reportText = await readFile(reportPath, 'utf8');
  const report = JSON.parse(reportText);
  assert.strictEqual(report.reportFormat, 'CTRF', 'report.json does not have CTRF format');
  assert.ok(report.results?.summary, 'report.json is missing results.summary');
  assert.ok(Array.isArray(report.results?.tests), "report.json's results.tests is not an array");
  return report;
};
