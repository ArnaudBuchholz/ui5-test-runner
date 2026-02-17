import { logger, logEnvironnement } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { defaults } from '../../configuration/options.js';
import { parallelize } from '../../utils/parallelize.js';
import { getAgentSource } from './agent.js';
import { setupBrowser } from './browser.js';
import { pageTask } from './pageTask.js';

/**
 * TODO
 * - log environment
 * - handle coverage
 * - allocate browser
 * - read agent to inject
 * - (legacy) build URL
 * - start server
 * - parallelize
 * - build reports
 */

export const test = async (configuration: Configuration) => {
  logger.start(configuration);
  logger.debug({ source: 'job', message: 'Configuration', data: { defaults, configuration } });

  await logEnvironnement();
  await getAgentSource();
  try {
    if (!configuration.url) {
      logger.fatal({ source: 'job', message: 'Expected URLs to be set' });
      throw new Error('stop');
    }
    const urls = configuration.url;
    const browser = await setupBrowser(configuration);
    logger.info({ source: 'progress', message: 'Executing pages', data: { uid: '', value: 0, max: 0 } });
    const pages = await parallelize(pageTask, urls, configuration.parallel);
    if (pages.every(({ status }) => status === 'fulfilled')) {
      // TODO: save report
    } else {
      // what should we do ?
    }
    // TODO: check that results[number].status === 'fulfilled'
    await browser.shutdown();
  } catch (error) {
    logger.error({ source: 'job', message: 'An error occurred', error });
  }
};
