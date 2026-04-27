import { __developmentMode, __sourcesRoot, FileSystem, Path /*, ZLib*/ } from '../platform/index.js';
import type { Configuration } from '../configuration/Configuration.js';
import type { CommonTestReport } from '../types/CommonTestReportFormat.js';

export const generateHtmlReport = async (configuration: Configuration, report: CommonTestReport) => {
  const path = __developmentMode
    ? Path.join(__sourcesRoot, '../dist', 'ui5-test-runner-html-report.js')
    : Path.join(__sourcesRoot, 'ui5-test-runner-html-report.js');
  const htmlReportJs = await FileSystem.readFile(path, 'utf8');
  const reportJson = JSON.stringify(report);
  // const buffer = ZLib.gzipSync(JSON.stringify(reportJson);
  // const base64 = buffer.toString('base64');

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
    <script>
      async function decompress (base64) {
        const bin = atob(base64)
        const uint8Array = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; ++i) {
          uint8Array[i] = bin.charCodeAt(i)
        }
        const readableStream = new ReadableStream({
          start (ctl) {
            ctl.enqueue(uint8Array)
            ctl.close()
          }
        })
        const decompressionStream = new DecompressionStream('gzip')
        const decompressedStream = readableStream.pipeThrough(decompressionStream)
        const jsonString = await new Response(decompressedStream).text()
        return JSON.parse(jsonString)
      }
    </script>
    <script type="module">window.ctrf = ${reportJson} /* await decompress('{base64}') */</script>
    <script type="module">${htmlReportJs}</script>
  </body>
</html>
`,
    'utf8'
  );
};
