import { logger, logEnvironnement, Exit, FileSystem, Path } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { defaults } from '../../configuration/options.js';
import { parallelize } from '../../utils/parallelize.js';
import { getAgentSource } from './agent.js';
import { setupBrowser } from './browser.js';
import { pageTask } from './pageTask.js';
import { report } from './report.js';
import { generateHtmlReport } from '../../reports/html.js';
import { Folder } from '../../utils/Folder.js';
import { server } from './server.js';

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
  await Folder.create(configuration.reportDir);
  logger.start(configuration);
  logger.debug({ source: 'job', message: 'Configuration', data: { defaults, configuration } });

  await logEnvironnement();
  await getAgentSource();

  let browser: Awaited<ReturnType<typeof setupBrowser>> | undefined;
  try {
    await server.start(configuration);

    if (!configuration.url) {
      logger.fatal({ source: 'job', message: 'Expected URLs to be set' });
      throw new Error('stop');
    }
    const urls = [...configuration.url];
    browser = await setupBrowser(configuration);
    await report.initialize();
    logger.info({ source: 'progress', message: 'Executing pages', data: { uid: '', value: 0, max: 0 } });
    let completed = 0;
    await parallelize(pageTask, urls, {
      parallel: configuration.parallel,
      on: (event) => {
        if (event.type === 'failed') {
          logger.error({ source: 'job', message: 'page failed', error: event.error, data: { url: event.input } });
          Exit.code = -1;
        }
        if (event.type === 'completed') {
          ++completed;
        }
        logger.info({
          source: 'progress',
          message: 'Executing pages',
          data: { uid: '', value: completed, max: urls.length }
        });
      }
    });
    report.finalize();
    FileSystem.writeFileSync(
      Path.join(configuration.reportDir, 'report.json'),
      JSON.stringify(report.merged, undefined, 2),
      'utf8'
    );
    await generateHtmlReport(configuration, report.merged);
  } catch (error) {
    logger.error({ source: 'job', message: 'An error occurred', error });
  } finally {
    await browser?.shutdown();
    // await server.stop();
  }
};
