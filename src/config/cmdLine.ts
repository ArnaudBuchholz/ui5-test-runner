import { getPlatformSingleton } from '../platform.js';
import { options } from './Config.js';
import type { Config } from './Config.js';
import { finalizeConfig as finalizeConfigImpl } from './finalize.js';
import type { IOption } from './IOption.js';
import { OptionType } from './IOption.js';

const setOption = (config: Partial<Config>, option: IOption, value?: string) => {
  const name = option.name as keyof Config;
  let set = false;
  if (value === undefined) {
    if (option.type === OptionType.boolean) {
      Object.assign(config, {
        [name]: true
      });
      set = true;
    }
  } else {
    if (option.multiple) {
      if (!(option.name in config)) {
        Object.assign(config, {
          [name]: []
        });
      }
      (config[name] as string[]).push(value);
    } else {
      Object.assign(config, {
        [name]: value
      });
    }
    set = true;
  }
  if (set && option.default !== undefined) {
    Object.assign(config, {
      [`${name}Set`]: true
    });
  }
};

const switchOption = (config: Partial<Config>, currentOption: IOption | undefined, newOptionName: string): IOption => {
  if (currentOption) {
    setOption(config, currentOption);
  }
  const option = options.find(({ name, short }) => name === newOptionName || short === newOptionName);
  if (!option) {
    throw new Error('Unknown option');
  }
  return option;
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
      currentOption = switchOption(config, currentOption, argument.slice(2));
      continue;
    }
    if (argument.startsWith('-')) {
      currentOption = switchOption(config, currentOption, argument.slice(1));
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
