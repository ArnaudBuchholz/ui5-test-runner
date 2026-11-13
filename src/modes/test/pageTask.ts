import type { IParallelizeContext } from '../../utils/shared/parallelize.js';
import { assert, Http, logger, Process } from '../../platform/index.js';
import { getAgentSource } from './agent.js';
import { getBrowser } from './browser.js';
import type { AgentState, SuitePage } from '../../types/AgentState.js';
import { Exit, ExitShutdownError } from '../../platform/Exit.js';
import { getReportBuilder } from './report.js';
import { createEmptyTestResults } from '../../types/CommonTestReportFormat.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import type { IWindow } from '../../browsers/IBrowser.js';
import { getBrowserConfigScript } from './browserConfig.js';
import type { PageCoverageOverride } from './browserConfig.js';
import type { IError } from '../../types/IError.js';
import { collect as collectCoverage } from './coverage/index.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { PageContext } from './PageContext.js';
import { makeScreenshotHandlers } from './screenshot.js';
import { getEffectiveTimeout, isGloballyTimedOut } from '../../utils/node/timeout.js';

const getPageTimeout = (configuration: Configuration, startTime: number): number =>
  getEffectiveTimeout(configuration.pageTimeout, configuration.globalTimeout, startTime);

// Merges a testsuite page's coverage only/never into the run-wide configuration so the report-side
// nyc settings (include/exclude globs) pick them up — the suite declares them per page, but the
// generated .nycrc.json used by `nyc report` is per run. Values accumulate as a deduped union across
// pages; mixing suites with different scopes therefore yields the union (see coverage_scope docs).
// Normalizes a coverage prefix declaration (string | string[]) to a sorted, deduped array.
const normalizePrefixes = (value: string | string[] | undefined): string[] =>
  value === undefined ? [] : [...new Set([value].flat())].toSorted((a, b) => a.localeCompare(b));

// Order-insensitive equality of two normalized (sorted) prefix lists.
const arePrefixesEqual = (a: string[], b: string[] | undefined): boolean =>
  a.length === (b ?? []).length && a.every((entry, index) => entry === (b ?? [])[index]);

const describeScope = (only: string[], never: string[]): string =>
  `only=[${only.join(', ')}] never=[${never.join(', ')}]`;

// Records the testsuite coverage scope on configuration.runtime. All testsuites in a run must declare
// the same only/never combination; a divergence is a fatal error — it is reported as a failed test and
// forces a non-zero exit (a bare throw would be swallowed by the page loop's catch).
const applySuiteCoverage = (context: PageContext, coverage: SuitePage['coverage']): void => {
  const only = normalizePrefixes(coverage?.only);
  const never = normalizePrefixes(coverage?.never);
  const { runtime } = context.configuration;
  if (runtime.coverageOnly === undefined && runtime.coverageNever === undefined) {
    runtime.coverageOnly = only;
    runtime.coverageNever = never;
    return;
  }
  if (arePrefixesEqual(only, runtime.coverageOnly) && arePrefixesEqual(never, runtime.coverageNever)) {
    return;
  }
  const message =
    'inconsistent coverage only/never across testsuites: ' +
    `${describeScope(runtime.coverageOnly ?? [], runtime.coverageNever ?? [])} vs ${describeScope(only, never)}. ` +
    'All testsuites in a run must declare the same coverage filter; run divergent scopes separately.';
  logger.error({ source: 'job', message, pageId: context.pageId });
  reportError(context.url, message);
  Exit.code = -1;
  throw new Error(message);
};

let lastPageId = 0;

export const agentStateMessage = (agentState: AgentState): string => {
  if (agentState.type === 'suite') return 'agent state: suite done';
  if (agentState.type === 'QUnit') {
    const kind = agentState.isOpa ? 'OPA' : 'QUnit';
    const progress = `${agentState.executed}/${agentState.total}`;
    return agentState.done ? `agent state: ${kind} done ${progress}` : `agent state: ${kind} ${progress}`;
  }
  return agentState.type === 'unknown' ? 'agent state: unknown' : 'agent state: loading';
};

const reportQunitProgress = (
  context: PageContext,
  agentState: Extract<AgentState, { type: 'QUnit' }>,
  isScreenshotEnabled: boolean
) => {
  if (!isScreenshotEnabled && agentState.isOpa) {
    context.loopDelay = 1000; // No need to stress out, they are slower
  }
  if (agentState.total <= 0) {
    return;
  }
  const { executed, total, errors } = agentState;
  if (executed === context.lastExecuted && total === context.lastTotal) {
    return;
  }
  const type = agentState.isOpa ? 'opa' : 'qunit';
  context.lastExecuted = executed;
  context.lastTotal = total;
  context.errors = errors;
  context.type = type;
  logger.info({
    source: 'progress',
    message: context.url,
    pageId: context.pageId,
    data: { max: agentState.total, value: agentState.executed, type, errors }
  });
};

export const reportError = (url: string, message: string, error?: IError) => {
  const result = createEmptyTestResults();
  result.summary.tests = 1;
  result.summary.failed = 1;
  result.tests.push({
    name: url,
    status: 'failed',
    message: `${message}, check the logs`,
    trace: error?.stack,
    duration: 0
  });
  getReportBuilder().merge(url, result);
};

const shouldUncaughtErrorsFail = (context: PageContext, errors: IError[]): boolean => {
  const { lastUncaughtErrorsCount, pageId } = context;
  let errorsCount = 0;
  let firstError: IError | undefined;
  if (lastUncaughtErrorsCount < errors.length) {
    let index = lastUncaughtErrorsCount;
    context.lastUncaughtErrorsCount = errors.length;
    for (; index < errors.length; ++index) {
      const error = errors[index]!;
      let logMethod: 'warn' | 'error' = 'error';
      let message = 'uncaught error';
      if (
        error.message === 'Called start() outside of a test context too many times' &&
        (error.stack?.includes('/sap/ui/thirdparty/qunit-2.js') || error.stack?.includes('/sap/ui/thirdparty/qunit.js'))
      ) {
        logMethod = 'warn';
        message = 'uncaught error (expected)';
      }
      logger[logMethod]({
        source: 'page',
        message,
        pageId,
        error
      });
      if (logMethod !== 'error') {
        continue;
      }

      if (firstError === undefined) {
        firstError = error;
      }
      ++errorsCount;
    }
  }
  if (errorsCount !== 0) {
    const errorDetail = `${firstError!.name}: ${firstError!.message}`;
    reportError(context.url, `Uncaught error(s): ${errorsCount} (first: ${errorDetail})`, firstError);
    return true;
  }
  return false;
};

const shouldStopBasedOnAgentState = (
  context: PageContext,
  isScreenshotEnabled: boolean,
  agentState: AgentState
): boolean => {
  logger.debug({
    source: 'page',
    message: agentStateMessage(agentState),
    data: { state: agentState },
    pageId: context.pageId
  });
  if (agentState.done) {
    if (agentState.type === 'suite') {
      const resolvedPages = agentState.pages.map((page) => {
        const resolvedUrl = new URL(page.url, context.url).href;
        // Testsuite coverage only/never only matters when coverage is being measured; ignore it
        // entirely otherwise (no instrumentation, no report — and no divergence check to fail on).
        if (page.coverage && context.configuration.coverage) {
          context.pageCoverageOverrides.set(resolvedUrl, {
            coverageOnly: page.coverage.only,
            coverageNever: page.coverage.never
          });
          // Record the testsuite coverage scope on configuration.runtime so the report-side nyc
          // settings pick up include/exclude globs (this makes filtering work in legacy mode, where
          // the browser gate is inert). Divergent scopes across testsuites are a fatal error.
          applySuiteCoverage(context, page.coverage);
          // Record that a testsuite drives the coverage scope; the runner drops any generated
          // baseline before reporting (see reportCoverage). The latch doubles as a once-only guard.
          if (!context.configuration.runtime.coverageBaselineInvalidated) {
            logger.info({
              source: 'job',
              message: 'coverage only/never detected from testsuite'
            });
          }
          context.configuration.runtime.coverageBaselineInvalidated = true;
        }
        return resolvedUrl;
      });
      for (const pageUrl of resolvedPages) {
        context.urls.push(pageUrl);
      }
      context.isSuite = true;
      logger.debug({
        source: 'page',
        message: `suite: dispatching ${resolvedPages.length} pages`,
        pageId: context.pageId,
        data: { pages: resolvedPages }
      });
    } else if (agentState.type === 'unknown') {
      logger.error({
        source: 'page',
        message: 'unable to detect page type',
        pageId: context.pageId,
        data: { state: agentState }
      });
      assert(false, 'unable to detect page type');
    } else {
      assert(agentState.type === 'QUnit', 'unexpected agent state');
      reportQunitProgress(context, agentState, isScreenshotEnabled);
    }
    return true;
  }
  if (agentState.type === 'QUnit') {
    reportQunitProgress(context, agentState, isScreenshotEnabled);
    if (agentState.uncaughtErrors?.length) {
      return shouldUncaughtErrorsFail(context, agentState.uncaughtErrors);
    }
  }
  return false;
};

const tryToFetchThePageFirst = async (url: string, pageId: number, configuration: Configuration): Promise<Response> => {
  try {
    const headers: Record<string, string> = {};
    const { browserBasicAuthUsername, browserBasicAuthPassword } = configuration;
    if (browserBasicAuthUsername !== undefined && browserBasicAuthPassword !== undefined) {
      const credentials = Buffer.from(`${browserBasicAuthUsername}:${browserBasicAuthPassword.reveal()}`).toString(
        'base64'
      );
      headers['Authorization'] = `Basic ${credentials}`;
    }
    const response = await Http.fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Unexpected status code ${response.status}`);
    }
    return response;
  } catch (error) {
    logger.info({
      source: 'progress',
      message: url,
      pageId,
      data: {
        max: 0,
        value: 1,
        type: 'unknown',
        errors: 1,
        remove: true
      }
    });
    reportError(url, 'An error occurred while fetching the URL');
    throw new Error('An error occurred while fetching the URL', { cause: error });
  }
};

const mergeTestResults = (
  url: string,
  pageId: number,
  context: PageContext,
  testResults: CommonTestReport['results']
) => {
  if (context.isSuite) {
    return;
  }

  const { passed, failed, tests, duration } = testResults.summary;
  const durationString = duration === undefined ? '' : ` (${duration}ms)`;
  logger.debug({
    source: 'page',
    message: `test results: passed=${passed} failed=${failed} tests=${tests}${durationString}`,
    pageId,
    data: { results: testResults }
  });

  getReportBuilder().merge(url, testResults, { pageId, type: context.type });
};

const runPollingLoop = async (
  context: PageContext,
  handlePendingScreenshot: ((page: IWindow, agentState: AgentState, pageId: number) => Promise<void>) | false,
  signal: AbortSignal
): Promise<void> => {
  while (!signal.aborted) {
    try {
      await Process.sleep(context.loopDelay);
      const agentState = (await context.page.eval("window['ui5-test-runner'].state")) as AgentState;
      if (handlePendingScreenshot) {
        await handlePendingScreenshot(context.page, agentState, context.pageId);
      }
      if (shouldStopBasedOnAgentState(context, handlePendingScreenshot !== false, agentState)) {
        break;
      }
    } catch (error) {
      logger.error({ source: 'page', message: 'an error occurred', error, pageId: context.pageId, data: {} });
      break;
    }
  }
};

export const makePageTask = (configuration: Configuration) => {
  const { screenshot } = configuration;
  const { handlePendingScreenshot, handleFailureScreenshot } = makeScreenshotHandlers(configuration);
  const ui5VersionByOrigin = new Map<string, string>();
  const pageCoverageOverrides = new Map<string, PageCoverageOverride>();

  const logUi5VersionOnce = async (probeUrl: string) => {
    const origin = new URL(probeUrl).origin;
    if (ui5VersionByOrigin.has(origin)) {
      return;
    }
    ui5VersionByOrigin.set(origin, ''); // marks origin as seen before the async call, preventing concurrent retries
    const versionUrl = new URL('/resources/sap-ui-version.json', probeUrl).href;
    try {
      const ui5Version = JSON.parse(await Http.getAsText(versionUrl)) as {
        libraries: { name: string; version: string }[];
      };
      const { version: coreVersion } = ui5Version.libraries.find(({ name }) => name === 'sap.ui.core') ?? {
        version: 'unknown'
      };
      ui5VersionByOrigin.set(origin, coreVersion);
      logger.info({ source: 'job', message: `UI5 version ${coreVersion} (from ${origin})` });
    } catch {
      // origin already flagged above — no retry will occur
    }
  };

  return async function (this: IParallelizeContext, url: string, _index: number, urls: string[]) {
    const pageId = ++lastPageId;
    logger.debug({ source: 'page', message: 'new page task', pageId, data: { url } });
    logger.info({
      source: 'progress',
      message: url,
      pageId,
      data: { max: 0, value: 1, type: 'unknown', errors: 0 }
    });

    const startTime = getReportBuilder().report.results.summary.start;
    if (isGloballyTimedOut(configuration.globalTimeout, startTime)) {
      logger.warn({ source: 'page', message: 'global timeout reached, skipping page', pageId, data: { url } });
      reportError(url, 'Global timeout reached');
      return;
    }

    await tryToFetchThePageFirst(url, pageId, configuration);
    await logUi5VersionOnce(url);

    const { promise: taskStopped, resolve: setTaskAsStopped } = Promise.withResolvers<void>();
    const stopController = new AbortController();
    using _ = Exit.registerAsyncTask({
      name: url,
      stop: async () => {
        stopController.abort();
        try {
          this.stop(new ExitShutdownError()); // throws
        } catch {
          // ignore
        } finally {
          await taskStopped;
        }
      }
    });
    let page: IWindow | undefined;
    let context: PageContext | undefined;
    try {
      const pageTimeoutMs = getPageTimeout(configuration, startTime);
      const agentSource = await getAgentSource();
      const coverageOverride = pageCoverageOverrides.get(url);
      pageCoverageOverrides.delete(url);
      const browserConfig = getBrowserConfigScript(pageId, coverageOverride);
      const scripts = [browserConfig, agentSource];
      const browser = getBrowser();
      page = await browser.newWindow({
        pageId,
        scripts,
        url
      });
      context = {
        configuration,
        pageId,
        urls,
        url,
        page,
        loopDelay: 250, // default
        type: 'unknown',
        lastExecuted: 0,
        errors: 0,
        lastTotal: 0,
        isSuite: false,
        lastUncaughtErrorsCount: 0,
        pageCoverageOverrides
      };
      const pageTimeoutController = new AbortController();
      let pageTimeoutHandle: ReturnType<typeof setTimeout> | undefined;
      if (pageTimeoutMs > 0) {
        pageTimeoutHandle = setTimeout(() => {
          logger.warn({ source: 'page', message: 'page timed out', pageId, data: { url } });
          pageTimeoutController.abort();
        }, pageTimeoutMs);
      }
      try {
        await runPollingLoop(
          context,
          !!screenshot && handlePendingScreenshot,
          AbortSignal.any([pageTimeoutController.signal, stopController.signal])
        );
      } finally {
        if (pageTimeoutHandle !== undefined) {
          clearTimeout(pageTimeoutHandle);
        }
      }
      const testResults = (await page.eval("window['ui5-test-runner'].results")) as CommonTestReport['results'];
      await handleFailureScreenshot(page, pageId, testResults);
      await collectCoverage(configuration, context);
      mergeTestResults(url, pageId, context, testResults);
      if (pageTimeoutController.signal.aborted) {
        reportError(url, 'page timed out');
      }
    } catch (error) {
      logger.error({ source: 'page', message: 'unexpected error while running page', error, pageId, data: {} });
      reportError(url, 'An unexpected error occurred');
    } finally {
      if (context !== undefined) {
        logger.info({
          source: 'progress',
          message: url,
          pageId,
          data: {
            max: context.lastTotal,
            value: context.lastExecuted,
            type: context.type,
            errors: context.errors,
            remove: true
          }
        });
      }
      if (page) {
        try {
          logger.debug({ source: 'page', message: 'closing page', pageId });
          await page.close();
        } catch (error) {
          logger.error({ source: 'page', message: 'page.close failed', error, pageId, data: {} });
        }
      }
      setTaskAsStopped();
    }
  };
};
