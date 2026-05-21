import { createAppConfig } from '../vite.config.shared.mjs';

export default createAppConfig({
  root: 'src/ui/log',
  name: 'ui5TestRunnerLogViewer',
  fileName: 'ui5-test-runner-log-viewer.js',
  serverOpen: '/log-viewer.html'
});
