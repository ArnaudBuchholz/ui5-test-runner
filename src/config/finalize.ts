import { getPlatformSingleton, IFileAccess, IFileStat } from '../platform.js';
// import { options } from './Config.js';
import type { Config }  from './Config.js';

export const finalizeConfig = async (config: Partial<Config>, platform: IFileStat & IFileAccess = getPlatformSingleton()): Promise<Config> {
  if (!config.cwd) {
    throw new Error('cwd is required');
  }
  return config as Config;
}
