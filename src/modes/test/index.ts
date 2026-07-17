import { logger, logEnvironnement, Exit, FileSystem, Path, Http, Host } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { defaults } from '../../configuration/options.js';
import { parallelize } from '../../utils/shared/parallelize.js';
import { getAgentSource } from './agent.js';
import { setupBrowser, getBrowser } from './browser.js';
import { pageTask } from './pageTask.js';
import { initBrowserConfig } from './browserConfig.js';
import { initReportBuilder, getReportBuilder, setReportBrowserInfo } from './report.js';
import { generateHtmlReport } from '../../reports/html.js';
import { Folder } from '../../utils/node/Folder.js';
import { server } from './server.js';
import { formatDuration } from '../../utils/shared/string.js';
import { start } from '../../start.js';
import { notifyProgress } from './notifyProgress.js';
import { end } from '../../end.js';

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
  await initReportBuilder(configuration);
  await Folder.create(configuration.reportDir);
  await logger.start(configuration);
  logger.debug({ source: 'job', message: 'Configuration', data: { defaults, configuration } });

  await logEnvironnement();
  await getAgentSource();

  let isBrowserStarted = false;
  try {
    await start(configuration);
    const port = await server.start(configuration);

    // TODO: only when local is being used
    const version = JSON.parse(await Http.getAsText(`http://localhost:${port}/resources/sap-ui-version.json`)) as {
      libraries: { name: string; version: string }[];
    };
    const { version: coreVersion } = version.libraries.find(({ name }: { name: string }) => name === 'sap.ui.core') ?? {
      version: 'unknown'
    };
    logger.info({ source: 'job', message: `UI5 version used by the local server: ${coreVersion}` });

    if (configuration.serveOnly) {
      const { promise, resolve } = Promise.withResolvers<void>();
      Exit.registerAsyncTask({
        name: 'serveOnly',
        stop: () => resolve()
      });
      logger.warn({ source: 'job', message: 'Serving only, use CTRL+C to end command' });
      await promise;
      return;
    }

    if (!configuration.url) {
      configuration.url = [new URL(configuration.testsuite, `http://localhost:0`).href];
    }

    const urls = configuration.url.map((url) => url.replace(':0/', () => `:${port}/`));
    const capabilities = await setupBrowser(configuration);
    setReportBrowserInfo(capabilities);
    isBrowserStarted = true;
    initBrowserConfig(configuration);
    notifyProgress('Executing pages', 0, 0);
    let completed = 0;
    let lastLoggedCompleted: number | undefined;
    let lastLoggedMax: number | undefined;
    await parallelize(pageTask, urls, {
      parallel: configuration.parallel,
      on: (event) => {
        if (event.type === 'failed') {
          logger.error({ source: 'job', message: 'page failed', error: event.error, data: { url: event.input } });
          Exit.code = -1;
        } else if (event.type === 'completed') {
          ++completed;
        }
        if (lastLoggedCompleted !== completed || lastLoggedMax !== urls.length) {
          lastLoggedCompleted = completed;
          lastLoggedMax = urls.length;
          notifyProgress('Executing pages', completed, urls.length);
        }
      }
    });
    getReportBuilder().finalize();
    FileSystem.writeFileSync(
      Path.join(configuration.reportDir, 'report.json'),
      JSON.stringify(getReportBuilder().report, undefined, 2),
      'utf8'
    );
    await generateHtmlReport(configuration, getReportBuilder().report);
    const { passed, failed, tests, duration } = getReportBuilder().report.results.summary;
    const durationString = duration ? ` (${formatDuration(duration)})` : '';
    logger.info({
      source: 'job',
      message: `Tests completed: passed=${passed} failed=${failed} tests=${tests}${durationString}`
    });
    if (Host.env['UI5TR_BATCH_MODE'] && typeof process.send === 'function') {
      process.send({ type: 'done', passed, failed, tests });
    }
    await end(configuration);
  } catch (error) {
    logger.error({ source: 'job', message: 'An error occurred', error });
  } finally {
    if (isBrowserStarted) {
      await getBrowser().shutdown();
    }
    await server.stop();
  }
};
