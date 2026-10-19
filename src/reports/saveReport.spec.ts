import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSystem } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import type { CommonTestReport } from '../types/CommonTestReportFormat.js';
import { saveReport } from './saveReport.js';

vi.mock('./html.js');
vi.mock('./textReport.js');

import { generateHtmlReport } from './html.js';
import { generateTextReport } from './textReport.js';

const REPORT_DIR = '/output';
const NO_CONFIGURATION = { reportDir: REPORT_DIR } as unknown as Configuration;
const STUB_REPORT = { reportFormat: 'CTRF' } as unknown as CommonTestReport;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(generateHtmlReport).mockResolvedValue(undefined);
});

describe('saveReport()', () => {
  it('writes report.json to the configured reportDir with 2-space JSON', async () => {
    await saveReport(NO_CONFIGURATION, STUB_REPORT);
    expect(FileSystem.writeFileSync).toHaveBeenCalledWith(
      `${REPORT_DIR}/report.json`,
      JSON.stringify(STUB_REPORT, undefined, 2),
      'utf8'
    );
  });

  it('calls generateHtmlReport with configuration and report', async () => {
    await saveReport(NO_CONFIGURATION, STUB_REPORT);
    expect(generateHtmlReport).toHaveBeenCalledWith(NO_CONFIGURATION, STUB_REPORT);
  });

  it('calls generateTextReport with configuration and report', async () => {
    await saveReport(NO_CONFIGURATION, STUB_REPORT);
    expect(generateTextReport).toHaveBeenCalledWith(NO_CONFIGURATION, STUB_REPORT);
  });
});
