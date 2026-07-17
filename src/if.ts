import { punyexpr } from 'punyexpr';
import type { Configuration } from './configuration/Configuration.js';
import { Host } from './platform/index.js';
import { version } from './platform/version.js';
import { compareVersions } from './utils/shared/version.js';

export const evaluateIf = async ({ if: condition }: Configuration): Promise<boolean> => {
  if (!condition) {
    return true;
  }

  const [nodeMajorVersion] = Host.version.slice(1).split('.');
  const runnerFullName = await version();
  const [runnerName, runnerVersion] = runnerFullName.split('@');

  return !!(punyexpr(condition) as (context: Record<string, unknown>) => unknown)({
    ...Host.env,
    UI5TR_NAME: runnerName,
    UI5TR_VERSION: runnerVersion,
    NODE_VERSIOM: Host.version,
    NODE_MAJOR_VERSION: Number(nodeMajorVersion),
    compareVersions
  });
};
