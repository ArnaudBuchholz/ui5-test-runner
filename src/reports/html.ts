import { __developmentMode, __sourcesRoot, FileSystem, Path } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import type { CommonTestReport } from '../types/CommonTestReportFormat.js';

export const generateHtmlReport = async (configuration: Configuration, report: CommonTestReport) => {
  const path = __developmentMode
    ? Path.join(__sourcesRoot, '../dist', 'ui5-test-runner-html-report.js')
    : Path.join(__sourcesRoot, 'ui5-test-runner-html-report.js');
  const htmlReportJs = await FileSystem.readFile(path, 'utf8');
  FileSystem.writeFileSync(
    Path.join(configuration.reportDir, 'report.html'),
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI5 Test Runner Report</title>
  </head>
  <body>
    <div id="app"></div>
    <script>window.ctrf = ${JSON.stringify(report)}</script>
    <script type="module">${htmlReportJs}</script>
  </body>
</html>
`,
    'utf8'
  );
};
