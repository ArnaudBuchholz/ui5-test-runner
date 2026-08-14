import { __developmentMode, __sourcesRoot, Path, FileSystem } from '../../platform/index.js';
import { memoize } from '../../utils/shared/memoize.js';

export const getAgentSource = memoize(async () => {
  const path = __developmentMode
    ? Path.join(__sourcesRoot, '../dist/ui', 'agent.js')
    : Path.join(__sourcesRoot, 'ui/agent.js');
  return FileSystem.readFile(path, 'utf8');
});

export const getCoverageAgentSource = memoize(async () => {
  const path = __developmentMode
    ? Path.join(__sourcesRoot, 'agent/ui5-coverage.js')
    : Path.join(__sourcesRoot, 'ui/ui5-coverage.js');
  return FileSystem.readFile(path, 'utf8');
});
