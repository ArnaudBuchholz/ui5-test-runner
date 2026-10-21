import type { BrowserSettings } from './IBrowser.js';
import { getExtraChromeArguments } from './chromeArguments.js';

export const buildChromeLaunchOptions = (
  options: BrowserSettings['options'],
  extraArguments: string[] = [],
  shouldIncludeEnvironmentArguments = true
) => {
  const rawArguments = options?.['args'];
  const userArguments = Array.isArray(rawArguments)
    ? rawArguments.filter((a): a is string => typeof a === 'string')
    : [];
  const rawIgnoreDefaultArguments = options?.['ignoreDefaultArgs'];
  let ignoreDefaultArguments: true | string[] | undefined;
  if (rawIgnoreDefaultArguments === true) {
    ignoreDefaultArguments = true;
  } else if (Array.isArray(rawIgnoreDefaultArguments)) {
    ignoreDefaultArguments = rawIgnoreDefaultArguments.filter(
      (argument): argument is string => typeof argument === 'string'
    );
  }
  return {
    args: [
      ...extraArguments,
      ...userArguments,
      ...(shouldIncludeEnvironmentArguments ? getExtraChromeArguments() : [])
    ],
    ...(ignoreDefaultArguments !== undefined && { ignoreDefaultArgs: ignoreDefaultArguments })
  };
};
