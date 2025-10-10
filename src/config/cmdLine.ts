import { getPlatformSingleton } from '../platform.js';
import { options } from './Config.js';
import type { Config } from './Config.js';
import { finalizeConfig as finalizeConfigImpl } from './finalize.js';
import type { IOption } from './IOption.js';
import { OptionValidationError } from './OptionValidationError.js';

const indexedOptions: { [key in string]?: IOption } = {};
for (const option of options) {
  const { name } = option;
  indexedOptions[name] = option;
  if ('short' in option) {
    indexedOptions[option.short] = option;
  }
  const kebabCase = name.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLocaleLowerCase()}`);
  if (name !== kebabCase) {
    indexedOptions[kebabCase] = option;
  }
}

type ConfigKeys = keyof Config;
// The command line config contains mostly strings (or array of strings for multiple params)
export type CmdLineConfig = {
  [K in ConfigKeys as Config[K] extends string[] | undefined ? K : never]?: string[];
} & {
  [K in ConfigKeys as Config[K] extends string[] | undefined ? never : K]?: string | boolean;
} & {
  errors: OptionValidationError[],
  positionals: string[],
};

const setOption = (config: CmdLineConfig, option: IOption, value?: string) => {
  const name = option.name as keyof Config;
  let set = false;
  if (value === undefined) {
    if (option.type === 'boolean') {
      Object.assign(config, {
        [name]: true
      });
      set = true;
    } else if (option.multiple !== true) {
      config.errors.push(new OptionValidationError(option, 'Missing value'));
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

const switchOption = (config: CmdLineConfig, currentOption: IOption | undefined, name: string): IOption => {
  if (currentOption) {
    setOption(config, currentOption);
  }
  const option = indexedOptions[name];
  if (!option) {
    throw new OptionValidationError({ name, type: 'string', description: 'unknown' }, 'Unknown option');
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
  const config: CmdLineConfig = { cwd, errors: [], positionals: [] };
  const { finalizeConfig = finalizeConfigImpl } = dependencies;
  const { platform = getPlatformSingleton() } = dependencies;

  const errors: unknown[] = [];

  let currentOption: IOption | undefined;
  for (const argument of argv) {
    try {
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
        if (currentOption.multiple !== true) {
          currentOption = undefined;
        }
      }
    } catch (error) {
      errors.push(error);
    }
  }
  if (currentOption) {
    try {
      setOption(config, currentOption);
    } catch (error) {
      errors.push(error);
    }
  }

  let finalConfig: Config;
  try {
    finalConfig = await (finalizeConfig ?? finalizeConfigImpl)(config, platform);
  } catch (error) {
    errors.push(error);
  }

  if (errors.length === 1) {
    throw errors[0];
  } else if (errors.length > 0) {
    throw new AggregateError(errors);
  }

  return finalConfig!;
};
