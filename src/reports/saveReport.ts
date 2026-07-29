import { FileSystem, Path } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import type { CommonTestReport } from '../types/CommonTestReportFormat.js';
import { generateHtmlReport } from './html.js';

export async function saveReport(configuration: Configuration, report: CommonTestReport): Promise<void> {
  FileSystem.writeFileSync(
    Path.join(configuration.reportDir, 'report.json'),
    JSON.stringify(report, undefined, 2),
    'utf8'
  );
  await generateHtmlReport(configuration, report);
}
