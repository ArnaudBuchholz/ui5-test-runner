import { logger, logEnvironnement, Exit, FileSystem, Path } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { defaults } from '../../configuration/options.js';
import { parallelize } from '../../utils/parallelize.js';
import { getAgentSource } from './agent.js';
import { setupBrowser } from './browser.js';
import { pageTask } from './pageTask.js';
import { report } from './report.js';

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
  let browser: Awaited<ReturnType<typeof setupBrowser>> | undefined;
  try {
    if (!configuration.url) {
      logger.fatal({ source: 'job', message: 'Expected URLs to be set' });
      throw new Error('stop');
    }
    const urls = configuration.url;
    browser = await setupBrowser(configuration);
    await report.initialize();
    logger.info({ source: 'progress', message: 'Executing pages', data: { uid: '', value: 0, max: 0 } });
    const pages = await parallelize(pageTask, urls, configuration.parallel);
    let allPagesSucceeded = true;
    for (const page of pages) {
      if (page.status !== 'fulfilled') {
        logger.error({ source: 'job', message: 'page failed', error: page.reason });
      }
      allPagesSucceeded = false;
    }
    if (!allPagesSucceeded) {
      logger.fatal({ source: 'job', message: 'At least one page did not process properly' });
      Exit.code = -1;
    }
    FileSystem.writeFileSync(
      Path.join(configuration.reportDir, 'report.json'),
      JSON.stringify(report.merged, undefined, 2),
      'utf8'
    );
  } catch (error) {
    logger.error({ source: 'job', message: 'An error occurred', error });
  } finally {
    await browser?.shutdown();
  }
};
