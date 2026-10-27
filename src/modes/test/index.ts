import { logger, logEnvironnement, Exit } from '../../platform/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { defaults } from '../../configuration/options.js';
import { redactSecrets } from '../../utils/node/anonymize.js';
import { toPlainObject } from '../../utils/shared/object.js';
import { parallelize } from '../../utils/shared/parallelize.js';
import { getAgentSource } from './agent.js';
import { setupBrowser, getBrowser } from './browser.js';
import { makePageTask, reportError } from './pageTask.js';
import { initBrowserConfig } from './browserConfig.js';
import { initReportBuilder, getReportBuilder, setReportBrowserInfo } from './report.js';
import { saveReport } from '../../reports/saveReport.js';
import { Folder } from '../../utils/node/Folder.js';
import { Server } from './Server.js';
import { formatDuration } from '../../utils/shared/string.js';
import { start } from '../../start.js';
import { end } from '../../end.js';
import { sendToParentProcess } from '../../sendToParentProcess.js';
import { instrument, generateReport } from './coverage/index.js';

const markFailed = () => {
  if (Exit.code === 0) {
    Exit.code = -1;
  }
};

export const test = async (configuration: Configuration) => {
  await initReportBuilder(configuration);
  await Folder.create(configuration.reportDir);
  await logger.start(configuration);
  sendToParentProcess({ type: 'report-dir', reportDir: configuration.reportDir });
  logger.debug({
    source: 'job',
    message: 'configuration',
    data: { defaults, configuration: redactSecrets(toPlainObject(configuration)) }
  });

  if (!configuration.noBanner) {
    await logEnvironnement();
  }
  await getAgentSource();

  let isBrowserStarted = false;
  try {
    await start(configuration);
    if (configuration.coverage) {
      await instrument(configuration);
    }
    const port = await Server.start(configuration);

    if (configuration.serveOnly) {
      const { promise, resolve } = Promise.withResolvers<void>();
      Exit.registerAsyncTask({
        name: 'serveOnly',
        stop: () => resolve()
      });
      logger.warn({ source: 'job', message: 'serving only, use CTRL+C to end command' });
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
    logger.info({ source: 'progress', message: 'executing pages', pageId: undefined, data: { value: 0, max: 0 } });
    sendToParentProcess({ type: 'progress', count: 0, total: 0 });
    let completed = 0;
    let lastLoggedCompleted: number | undefined;
    let lastLoggedMax: number | undefined;
    const startedIndices = new Set<number>();
    await parallelize(makePageTask(configuration), urls, {
      parallel: configuration.parallel,
      on: (event) => {
        if (event.type === 'started') {
          startedIndices.add(event.index);
        } else if (event.type === 'failed') {
          logger.error({ source: 'job', message: 'page failed', error: event.error, data: { url: event.input } });
          ++completed;
        } else if (event.type === 'completed') {
          ++completed;
        }
        if (lastLoggedCompleted === completed && lastLoggedMax === urls.length) {
          return;
        }

        lastLoggedCompleted = completed;
        lastLoggedMax = urls.length;
        logger.info({
          source: 'progress',
          message: 'executing pages',
          pageId: undefined,
          data: { value: completed, max: urls.length }
        });
        sendToParentProcess({ type: 'progress', count: completed, total: urls.length });
      }
    });
    for (const [index, url] of urls.entries()) {
      if (!startedIndices.has(index)) {
        reportError(url, 'not executed (process was interrupted)');
      }
    }
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
    logger.error({ source: 'job', message: 'an error occurred', error });
    markFailed();
  } finally {
    if (isBrowserStarted) {
      await getBrowser().shutdown();
    }
    await Server.stop();
  }
};
