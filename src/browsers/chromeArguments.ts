import { Host } from '../platform/index.js';

export const getExtraChromeArguments = (): string[] => {
  const raw = Host.env['UI5TR_CHROME_ARGS'];
  return raw === undefined ? [] : raw.split(/\s+/).filter((argument) => argument.length > 0);
};
