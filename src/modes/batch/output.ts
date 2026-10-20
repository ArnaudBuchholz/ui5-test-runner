import { FileSystem, Path, logger } from '../../platform/index.js';
import type { IBatchItem } from './BatchItem.js';

/** Print completed child reports in a stable, human-readable order. */
export const printBatchOutput = async (items: IBatchItem[]): Promise<void> => {
  const sortedItems = [...items].toSorted((left, right) => left.id.localeCompare(right.id));

  for (const item of sortedItems) {
    try {
      if (!item.reportDir) {
        continue;
      }
      const output = await FileSystem.readFile(Path.join(item.reportDir, 'output.txt'), 'utf8');
      logger.info({
        source: 'job',
        message: `Batch output: ${item.label} (${item.id})\n${output}`
      });
    } catch {
      logger.warn({
        source: 'job',
        message: `No batch output: ${item.label} (${item.id})`
      });
    }
  }
};
