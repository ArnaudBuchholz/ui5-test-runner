import { getPlatformSingleton } from '../platform.js';
import { options } from './Config.js';
import type { Config } from './Config.js';
import { finalizeConfig as finalizeConfigImpl } from './finalize.js';
import type { IOption } from './IOption.js';
import { OptionType } from './IOption.js';

const setOption = (config: Partial<Config>, option: IOption, value?: string) => {
  const name = option.name as keyof Config;
  if (!value && option.type === OptionType.boolean) {
    Object.assign(config, {
      [name]: true
    });
  }
  if (value !== undefined && option.multiple) {
    if (!(option.name in config)) {
      Object.assign(config, {
        [name]: []
      });
    }
    (config[name] as string[]).push(value);
  }
};

export const fromCmdLine = async (
  cwd: string,
  argv: string[],
  dependencies: {
    finalizeConfig?: typeof finalizeConfigImpl;
    platform?: Parameters<typeof finalizeConfigImpl>[1];
  } = {}
) => {
  const config: Partial<Config> = { cwd };
  const { finalizeConfig = finalizeConfigImpl } = dependencies;
  const { platform = getPlatformSingleton() } = dependencies;

  let currentOption: IOption | undefined;
  for (const argument of argv) {
    if (argument.startsWith('--')) {
      if (currentOption) {
        setOption(config, currentOption);
      }
      const criteria = argument.slice(2);
      const option = options.find(({ name }) => name === criteria);
      if (!option) {
        throw new Error('Unknown option');
      }
      currentOption = option as IOption;
      continue;
    }
    if (argument.startsWith('-')) {
      if (currentOption) {
        setOption(config, currentOption);
      }
      const criteria = argument.slice(1);
      const option = options.find(({ short }) => short === criteria);
      if (!option) {
        throw new Error('Unknown option');
      }
      currentOption = option as IOption;
      continue;
    }
    if (currentOption !== undefined) {
      setOption(config, currentOption, argument);
    }
  }
  if (currentOption) {
    setOption(config, currentOption);
  }

  return await (finalizeConfig ?? finalizeConfigImpl)(config, platform);
};
