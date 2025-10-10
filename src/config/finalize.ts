import type { IFileAccess, IFileStat } from '../platform.js';
import { getPlatformSingleton } from '../platform.js';
// import { options } from './Config.js';
import type { Config } from './Config.js';

export const finalizeConfig = async (
  config: object,
  platform: IFileStat & IFileAccess = getPlatformSingleton()
): Promise<Config> => {
  if (!('cwd' in config)) {
    throw new Error('cwd is required');
  }
  return config as Config;
};
