import { __developmentMode, __sourcesRoot, Path, FileSystem } from '../../platform/index.js';
import { memoize } from '../../utils/memoize.js';

export const getAgentSource = memoize(async () => {
  const path = __developmentMode
    ? Path.join(__sourcesRoot, '../dist', 'ui5-test-runner-agent.js')
    : Path.join(__sourcesRoot, 'ui5-test-runner-agent.js');
  return FileSystem.readFile(path, 'utf8');
});
