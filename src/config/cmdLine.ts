import { getPlatformSingleton } from '../platform.js';
import { options } from './Config.js';
import type { Config } from './Config.js';
import { finalizeConfig as finalizeConfigImpl } from './finalize.js';
import { IOption, OptionType } from './IOption.js';

const setOption = (config: Partial<Config>, option: IOption, value?: string) => {
  if (!value) {
    if (option.type === OptionType.boolean) {
      Object.assign(config, {
        [option.name]: true
      });
    }
  }
};

export const fromCmdLine = async (
  cwd: string,
  argv: string[],
  dependencies: {
    finalizeConfig?: typeof finalizeConfigImpl,
    platform?: Parameters<typeof finalizeConfigImpl>[1]
  } = {}) => {
  const config: Partial<Config> = { cwd };
  const { finalizeConfig = finalizeConfigImpl } = dependencies;
  const { platform = getPlatformSingleton() } = dependencies;

  let currentOption: IOption | undefined;
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      if (currentOption) {
        setOption(config, currentOption);
      }
      const criteria = arg.slice(2);
      const option = options.find(({ name }) => name === criteria);
      if (!option) {
        throw new Error('Unknown option');
      }
      currentOption = option as IOption;
    }
  }
  if (currentOption) {
    setOption(config, currentOption);
  }

  return await (finalizeConfig ?? finalizeConfigImpl)(config, platform);
};
