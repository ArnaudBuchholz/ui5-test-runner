import { FileSystem, Path, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';
import type { PageContext } from '../PageContext.js';

export const collect = async (
  configuration: Configuration,
  { pageId, url }: PageContext,
  coverageData: unknown
): Promise<void> => {
  const fileName = `${pageId}.json`;
  const filePath = Path.join(configuration.coverageTempDir, fileName);
  await FileSystem.writeFile(filePath, JSON.stringify(coverageData));
  logger.debug({ source: 'coverage', pageId, message: `Coverage collected for ${url}`, data: { filePath } });
};
