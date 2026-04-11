import { logger, logEnvironnement, Exit, FileSystem, Path, Http } from '../../platform/index.js';
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
import { formatDuration } from '../../utils/string.js';

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
    const port = await server.start(configuration);

    // TODO: only when local is being used
    const version = JSON.parse(await Http.get(`http://localhost:${port}/resources/sap-ui-version.json`)) as {
      libraries: { name: string; version: string }[];
    };
    const { version: coreVersion } = version.libraries.find(({ name }: { name: string }) => name === 'sap.ui.core') ?? {
      version: 'unknown'
    };
    logger.info({ source: 'job', message: `UI5 version used by the local server: ${coreVersion}` });

    if (!configuration.url) {
      configuration.url = [new URL(configuration.testsuite, `http://localhost:0`).toString()];
    }

    const urls = [...configuration.url.map((url) => url.replace(':0/', `:${port}/`))];
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
    const { duration } = report.merged.results.summary;
    if (duration) {
      logger.info({ source: 'job', message: `Tests duration: ${formatDuration(duration)}` });
    }
  } catch (error) {
    logger.error({ source: 'job', message: 'An error occurred', error });
  } finally {
    await browser?.shutdown();
    await server.stop();
  }
};
