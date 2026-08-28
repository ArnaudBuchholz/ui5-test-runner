import { logger, Path, Process, Host, __sourcesRoot } from '../../platform/index.js';
import { options } from '../../configuration/options.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { IBatchItem } from './BatchItem.js';
import { toKebabCase } from '../../utils/shared/string.js';
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
type IPCMessage = ProgressMessage | SkipMessage;

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
    logger.warn({ source: 'page', message: 'Global timeout reached, skipping batch item', pageId, data: { label } });
    batchItem.skipped = true;
    return batchItem;
  }

  batchItem.start = new Date();

  const parameters: string[] = [...buildRunnerCommand(), ...batchItem.args];
  if (configuration.sources['reportDir'] === 'cli') {
    parameters.push('--report-dir', Path.join(configuration.reportDir, batchItem.id));
  }
  parameters.push(...buildForwardedParameters(configuration));
  const childProcess = Process.spawn('node', parameters, {
    env: { ...Host.env, UI5TR_BATCH_MODE: '1' },
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
      logger.warn({ source: 'page', message: 'Batch item timed out', pageId, data: { label } });
      batchItem.timedOut = true;
      void childProcess.kill();
    }, batchTimeoutMs);
    await childProcess.closed;
    clearTimeout(timeoutHandle);
  } else {
    await childProcess.closed;
  }

  batchItem.end = new Date();
  batchItem.statusCode = childProcess.code;
  if (batchItem.skipped) {
    logger.warn({ source: 'page', pageId, message: `skipped ${label}` });
  } else if (batchItem.statusCode === 0 && !batchItem.timedOut) {
    logger.info({
      source: 'page',
      pageId,
      message: `succeeded ${label}`
    });
  } else {
    logger.error({
      source: 'page',
      pageId,
      message: `failed ${label}`
    });
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
