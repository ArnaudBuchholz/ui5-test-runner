import { FileSystem, Path, assert, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import type { PageContext } from '../PageContext.js';

type CoverageEntry = { path: string } & Record<string, unknown>;
type CoverageData = Record<string, CoverageEntry>;

const isCoverageData = (value: unknown): value is CoverageData => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const entries = Object.values(value as Record<string, unknown>);
  return (
    entries.length > 0 &&
    entries.every(
      (entry) => entry !== null && typeof entry === 'object' && 'path' in entry && typeof entry['path'] === 'string'
    )
  );
};

const remapPaths = (coverageData: CoverageData, sourceDirectory: string): CoverageData =>
  Object.fromEntries(
    Object.entries(coverageData).map(([key, entry]) => {
      const absoluteKey = Path.join(sourceDirectory, key);
      return [absoluteKey, { ...entry, path: absoluteKey }];
    })
  );

export const collect = async (configuration: Configuration, pageContext: PageContext): Promise<void> => {
  const { page, pageId, url, isSuite } = pageContext;
  if (isSuite || !configuration.coverage) {
    return;
  }
  const coverageData = await page.eval('window.__coverage__');
  if (!coverageData) {
    logger.warn({ source: 'coverage', pageId, message: 'No coverage data found for page', data: { url } });
    return;
  }
  assert(isCoverageData(coverageData), `Invalid coverage data for page ${url}`);
  let data = coverageData;
  const firstFilePath = Object.keys(data)[0]!;
  try {
    await FileSystem.access(firstFilePath, FileSystem.constants.R_OK);
  } catch {
    logger.debug({ source: 'coverage', pageId, message: 'Coverage data requires mapping' });
    data = remapPaths(coverageData, configuration.coverageSourceDir ?? configuration.webapp);
  }
  const fileName = `${pageId}.json`;
  const filePath = Path.join(configuration.coverageTempDir, fileName);
  await FileSystem.writeFile(filePath, JSON.stringify(data));
  logger.debug({ source: 'coverage', pageId, message: `Coverage collected for ${url}`, data: { filePath } });
};
