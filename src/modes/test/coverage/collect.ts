import { FileSystem, Path, logger } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';

let coverageFileIndex = 0;

const hashUrl = (url: string): string => url.replaceAll(/[^\w]/g, '_');

export const collect = async (configuration: Configuration, url: string, coverageData: unknown): Promise<void> => {
  const fileName = `${hashUrl(url)}_${++coverageFileIndex}.json`;
  const filePath = Path.join(configuration.coverageTempDir, fileName);
  await FileSystem.writeFile(filePath, JSON.stringify(coverageData));
  logger.debug({ source: 'coverage', message: `Coverage collected for ${url}`, data: { filePath } });
};
