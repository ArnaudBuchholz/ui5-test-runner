import { __developmentMode, __sourcesRoot, Path, FileSystem } from '../../platform/index.js';
import { memoize } from '../../utils/memoize.js';
import type { Configuration } from 'reserve';
import type { ILogStorage } from './ILogStorage.js';
import type { LogMetrics } from './LogMetrics.js';

const getLogViewerSource = memoize(async () => {
  /* v8 ignore next -- @preserve */
  const path = __developmentMode
    ? Path.join(__sourcesRoot, '../dist', 'ui5-test-runner-log-viewer.js')
    : Path.join(__sourcesRoot, 'ui5-test-runner-log-viewer.js');
  return FileSystem.readFile(path, 'utf8');
});

const getAsInt = (parameters: URLSearchParams, key: string): number | undefined => {
  const value = parameters.get(key);
  return value ? Number.parseInt(value) : undefined;
};

export const buildREserveConfiguration = (
  storage: ILogStorage,
  metrics: LogMetrics,
  abortController: AbortController
): Configuration => ({
  port: 0,
  mappings: [
    {
      custom: (request, response) => {
        response.setHeader('x-metrics-chunks-count', metrics.chunksCount.toString());
        response.setHeader('x-metrics-input-size', metrics.inputSize.toString());
        response.setHeader('x-metrics-output-size', metrics.outputSize.toString());
        response.setHeader('x-metrics-logs-count', storage.length.toString());
      }
    },
    {
      method: 'GET',
      match: '/query',
      custom: ({ url }) => {
        const searchParameters = new URLSearchParams(new URL(url!, 'http://localhost').search);
        const from = getAsInt(searchParameters, 'from');
        const to = getAsInt(searchParameters, 'to');
        const skip = getAsInt(searchParameters, 'skip');
        const limit = getAsInt(searchParameters, 'limit');
        const filter = searchParameters.get('filter') ?? undefined;
        return [storage.fetch({ from, to, skip, limit, filter })];
      }
    },
    {
      method: 'GET',
      match: '/log-viewer.js',
      custom: async () => [
        await getLogViewerSource(),
        {
          headers: {
            'Content-Type': 'application/javascript'
          }
        }
      ]
    },
    {
      match: '/close',
      custom: () => {
        abortController.abort();
        return 200;
      }
    },
    {
      method: 'GET',
      custom: () => [
        `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI5 Test Runner Log Viewer</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/log-viewer.js"></script>
    <script>
const close = () => navigator.sendBeacon('/close');
document.addEventListener('visibilitychange', () => (document.visibilityState === 'hidden') && close());
window.addEventListener('pagehide', (event) => (!event.persisted) && close());
    </script>
  </body>
</html>
`,
        {
          headers: {
            'Content-Type': 'text/html'
          }
        }
      ]
    }
  ]
});
