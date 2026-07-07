import { logger } from '../../platform/index.js'; 
import type { Configuration } from '../../configuration/Configuration.js';


export const end = async (configuration: Configuration): Promise<void> => {
  if (!configuration.end) {
    return;
  }
  logger.info({ source: 'progress', message: 'Executing end command',  pageId: undefined, data: { value: 0, max: 0 } });
};
