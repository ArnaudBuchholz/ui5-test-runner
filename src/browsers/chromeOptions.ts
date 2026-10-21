import type { BrowserSettings } from './IBrowser.js';
import { getExtraChromeArguments } from './chromeArguments.js';

export const buildChromeLaunchOptions = (
  options: BrowserSettings['options'],
  extraArgs: string[] = [],
  includeEnvArgs = true
) => {
  const rawArguments = options?.['args'];
  const userArguments = Array.isArray(rawArguments)
    ? rawArguments.filter((a): a is string => typeof a === 'string')
    : [];
  const rawIgnoreDefaultArgs = options?.['ignoreDefaultArgs'];
  const ignoreDefaultArgs =
    rawIgnoreDefaultArgs === true
      ? true
      : Array.isArray(rawIgnoreDefaultArgs)
        ? rawIgnoreDefaultArgs.filter((a): a is string => typeof a === 'string')
        : undefined;
  return {
    args: [...extraArgs, ...userArguments, ...(includeEnvArgs ? getExtraChromeArguments() : [])],
    ...(ignoreDefaultArgs !== undefined ? { ignoreDefaultArgs } : {})
  };
};
