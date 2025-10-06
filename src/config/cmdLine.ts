import type { Config } from './Config.js';
import { finalizeConfig as finalizeConfigImpl } from './finalize.js';

export const fromCmdLine = async (
  cwd: string,
  argv: string[],
  {
    finalizeConfig,
    platform
  }: {
    finalizeConfig?: typeof finalizeConfigImpl,
    platform?: Parameters<typeof finalizeConfigImpl>[1]
  } = {}) => {
  const config: Partial<Config> = { cwd };

  return await (finalizeConfig ?? finalizeConfigImpl)(config, platform);
};
