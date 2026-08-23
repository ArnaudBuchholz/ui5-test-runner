import { logger, logEnvironnement, Exit, Http } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { defaults } from '../../configuration/options.js';
import { parallelize } from '../../utils/shared/parallelize.js';
import { getAgentSource } from './agent.js';
import { setupBrowser, getBrowser } from './browser.js';
import { makePageTask } from './pageTask.js';
import { initBrowserConfig } from './browserConfig.js';
import { initReportBuilder, getReportBuilder, setReportBrowserInfo } from './report.js';
import { saveReport } from '../../reports/saveReport.js';
import { Folder } from '../../utils/node/Folder.js';
import { server } from './server.js';
import { formatDuration } from '../../utils/shared/string.js';
import { start } from '../../start.js';
import { end } from '../../end.js';
import { sendToParentProcess } from '../../sendToParentProcess.js';
import { instrument, generateReport } from './coverage/index.js';

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
    if (configuration.coverage) {
      await instrument(configuration);
    }
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
    logger.info({ source: 'progress', message: 'Executing pages', pageId: undefined, data: { value: 0, max: 0 } });
    sendToParentProcess({ type: 'progress', count: 0, total: 0 });
    let completed = 0;
    let lastLoggedCompleted: number | undefined;
    let lastLoggedMax: number | undefined;
    await parallelize(makePageTask(configuration), urls, {
      parallel: configuration.parallel,
      on: (event) => {
        if (event.type === 'failed') {
          logger.error({ source: 'job', message: 'page failed', error: event.error, data: { url: event.input } });
          ++completed;
        } else if (event.type === 'completed') {
          ++completed;
        }
        if (lastLoggedCompleted !== completed || lastLoggedMax !== urls.length) {
          lastLoggedCompleted = completed;
          lastLoggedMax = urls.length;
          logger.info({
            source: 'progress',
            message: 'Executing pages',
            pageId: undefined,
            data: { value: completed, max: urls.length }
          });
          sendToParentProcess({ type: 'progress', count: completed, total: urls.length });
        }
      }
    });
    getReportBuilder().finalize();
    if (configuration.coverage) {
      const coverageFailure = await generateReport(configuration);
      if (coverageFailure) {
        getReportBuilder().merge('coverage', coverageFailure);
      }
    }
    const { report } = getReportBuilder();
    await saveReport(configuration, report);
    const { passed, failed, tests, duration } = report.results.summary;
    const durationString = duration ? ` (${formatDuration(duration)})` : '';
    logger.info({
      source: 'job',
      message: `Tests completed: passed=${passed} failed=${failed} tests=${tests}${durationString}`
    });
    if (failed) {
      Exit.code = -1;
    }
    sendToParentProcess({ type: 'done', passed, failed, tests });
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
