import { logger, Path, Process, Host, __sourcesRoot, FileSystem } from '../../platform/index.js';
import { options } from '../../configuration/options.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { IBatchItem } from './BatchItem.js';
import type { CommonTestReport } from '../../types/CommonTestReportFormat.js';
import { toKebabCase, formatDuration } from '../../utils/shared/string.js';
import { getEffectiveTimeout, isGloballyTimedOut } from '../../utils/node/timeout.js';

const getBatchTimeout = (configuration: Configuration, startTime: number): number =>
  getEffectiveTimeout(configuration.batchTimeout, configuration.globalTimeout, startTime);

const buildRunnerCommand = () => {
  const extension = Path.extname(import.meta.url);
  const cliPath = Path.join(__sourcesRoot, 'cli' + extension);
  const js2tsUrl = Path.join(__sourcesRoot, 'platform/js2ts.mjs');
  /* v8 ignore next -- @preserve */
  return extension === '.ts' ? ['--no-warnings', '--import', js2tsUrl, cliPath] : [cliPath];
};

const forwardedOptions = options.filter((o) => 'batchForwarded' in o && o.batchForwarded);

const buildForwardedParameters = (configuration: Configuration): string[] => {
  const parameters: string[] = [];
  for (const option of forwardedOptions) {
    const name = option.name as keyof Configuration;
    if (configuration.sources[name] !== 'cli') {
      continue;
    }
    const flag = `--${toKebabCase(option.name)}`;
    const value = configuration[name];
    if (option.type === 'boolean') {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string -- narrowed to boolean by option.type check, TypeScript cannot track this through the wide Configuration union
      parameters.push(flag, String(value));
    } else if (option.type === 'json') {
      parameters.push(flag, JSON.stringify(value));
    } else if ('multiple' in option && option.multiple) {
      for (const item of value as string[]) {
        parameters.push(flag, item);
      }
    } else {
      // TODO: some options might need a rewrite
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, unicorn/no-useless-template-literals, @typescript-eslint/no-base-to-string -- forwarded scalar options are string/number/timeout, not complex objects
      parameters.push(flag, `${value}`);
    }
  }
  return parameters;
};

type ProgressMessage = { type: 'progress'; count: number; total: number };
type SkipMessage = { type: 'skip' };
type ReportDirectoryMessage = { type: 'report-dir'; reportDir: string };
type IPCMessage = ProgressMessage | SkipMessage | ReportDirectoryMessage;

const MAX_MESSAGE_LENGTH = 120;

const buildFailureMessage = async (reportDirectory: string): Promise<string | undefined> => {
  try {
    const raw = await FileSystem.readFile(Path.join(reportDirectory, 'report.json'), 'utf8');
    const report = JSON.parse(raw) as CommonTestReport;
    const failed = report.results.tests.filter((t) => t.status === 'failed');
    if (failed.length === 0) {
      return undefined;
    }
    const prefix = `${failed.length} test${failed.length > 1 ? 's' : ''} failed: `;
    let names = failed.map((t) => t.name).join(', ');
    if (prefix.length + names.length > MAX_MESSAGE_LENGTH) {
      names = names.slice(0, MAX_MESSAGE_LENGTH - prefix.length - 1) + '…';
    }
    return prefix + names;
  } catch {
    return undefined;
  }
};

let lastPageId = 0;

export const batchTask = async (
  configuration: Configuration,
  batchItem: IBatchItem,
  startTime: number
): Promise<IBatchItem> => {
  const pageId = ++lastPageId;
  const label = `${batchItem.label} (${batchItem.id})`;
  logger.info({
    source: 'progress',
    message: label,
    pageId,
    data: { max: 0, value: 1, type: 'unknown', errors: 0 }
  });

  if (isGloballyTimedOut(configuration.globalTimeout, startTime)) {
    logger.warn({ source: 'page', message: 'global timeout reached, skipping batch item', pageId, data: { label } });
    batchItem.skipped = true;
    batchItem.message = 'batch item not executed (process was interrupted)';
    return batchItem;
  }

  batchItem.start = new Date();
  const reportDirectory = Path.join(configuration.reportDir, batchItem.id);
  batchItem.reportDir = reportDirectory;

  const parameters: string[] = [
    ...buildRunnerCommand(),
    '--no-banner',
    ...batchItem.args,
    ...buildForwardedParameters(configuration)
  ];
  const childProcess = Process.spawn('node', parameters, {
    env: { ...Host.env, UI5TR_BATCH_MODE: '1', UI5TR_BATCH_REPORT_DIR: reportDirectory },
    windowsHide: true,
    onMessage: (data) => {
      const message = data as IPCMessage;
      if (message?.type === 'progress') {
        logger.info({
          source: 'progress',
          message: label,
          pageId,
          data: { value: message.count, max: message.total, errors: 0, type: 'unknown' }
        });
      } else if (message?.type === 'skip') {
        batchItem.skipped = true;
      } else if (message?.type === 'report-dir') {
        batchItem.reportDir = message.reportDir;
      }
    }
  });
  logger.debug({
    source: 'page',
    message: 'new batch task',
    pageId,
    data: { ...batchItem, processId: childProcess.pid }
  });

  const batchTimeoutMs = getBatchTimeout(configuration, startTime);
  if (batchTimeoutMs > 0) {
    const timeoutHandle = setTimeout(() => {
      logger.warn({ source: 'page', message: 'batch item timed out', pageId, data: { label } });
      batchItem.timedOut = true;
      batchItem.message = 'batch item timed out, check the logs';
      void childProcess.kill();
    }, batchTimeoutMs);
    await childProcess.closed;
    clearTimeout(timeoutHandle);
  } else {
    await childProcess.closed;
  }

  batchItem.end = new Date();
  batchItem.statusCode = childProcess.code;
  const duration = formatDuration(batchItem.end.getTime() - batchItem.start.getTime());
  if (batchItem.skipped) {
    logger.warn({ source: 'page', pageId, message: `skipped ${label} (${duration})` });
  } else if (batchItem.statusCode === 0 && !batchItem.timedOut) {
    logger.info({
      source: 'page',
      pageId,
      message: `succeeded ${label} (${duration})`
    });
  } else {
    logger.error({
      source: 'page',
      pageId,
      message: `failed ${label} (${duration})`
    });
    batchItem.message = await buildFailureMessage(batchItem.reportDir ?? reportDirectory);
  }

  logger.debug({
    source: 'page',
    message: 'batch task closed',
    pageId,
    data: { ...batchItem, processId: childProcess.pid }
  });
  logger.info({
    source: 'progress',
    message: label,
    pageId,
    data: { max: 0, value: 0, type: 'unknown', errors: 0, remove: true }
  });
  return batchItem;
};
