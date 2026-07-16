import { logger, Process, Host } from '../../platform/index.js';
import { options } from '../../configuration/options.js';
import type { Configuration } from '../../configuration/Configuration.js';
import type { IBatchItem } from './BatchItem.js';
import { join } from 'node:path';

const toKebabCase = (name: string): string => name.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

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
      if (value) {
        parameters.push(flag);
      } else {
        parameters.push(`--no-${toKebabCase(option.name)}`);
      }
    } else if ('multiple' in option && option.multiple) {
      for (const item of value as string[]) {
        parameters.push(flag, String(item));
      }
    } else {
      parameters.push(flag, String(value));
    }
  }
  return parameters;
};

type ProgressMessage = { type: 'progress'; count: number; total: number };

export const task = async (configuration: Configuration, batchItem: IBatchItem): Promise<void> => {
  batchItem.start = new Date();
  const label = `${batchItem.label} (${batchItem.id})`;

  const parameters: string[] = [...batchItem.args];

  if (configuration.sources['reportDir'] === 'cli') {
    parameters.push('--report-dir', join(configuration.reportDir, batchItem.id));
  }

  parameters.push(...buildForwardedParameters(configuration));

  const childProcess = Process.spawn('node', parameters, {
    env: { ...Host.env, UI5TR_BATCH_MODE: '1' },
    windowsHide: true,
    onMessage: (data) => {
      const msg = data as ProgressMessage;
      if (msg?.type === 'progress') {
        logger.info({
          source: 'progress',
          message: label,
          pageId: undefined,
          data: { value: msg.count, max: msg.total }
        });
      }
    }
  });

  await childProcess.closed;
  batchItem.end = new Date();
  batchItem.statusCode = childProcess.code;

  if (childProcess.code === 0) {
    logger.info({ source: 'job', message: `✔️  ${label}` });
  } else {
    logger.info({ source: 'job', message: `❌ ${label} (exit code: ${childProcess.code})` });
  }
};
