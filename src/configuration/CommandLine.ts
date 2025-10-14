import { options } from './options.js';
import type { Configuration } from './Configuration.js';
import { ConfigurationValidator, finalizeConfig as finalizeConfigImpl } from './ConfigurationValidator.js';
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

type ConfigKeys = keyof Configuration;
// The command line config contains mostly strings (or array of strings for multiple params)
export type CmdLineConfig = {
  [K in ConfigKeys as Configuration[K] extends string[] | undefined ? K : never]?: string[];
} & {
  [K in ConfigKeys as Configuration[K] extends boolean | undefined ? K : never]?: string | boolean;
} & {
  [K in ConfigKeys as Configuration[K] extends string[] | boolean | undefined ? never : K]?: string;
} & {
  errors: unknown[];
  positionals: string[];
};

const setOption = (config: CmdLineConfig, option: IOption, value?: string) => {
  const name = option.name as keyof Configuration;
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

export class CommandLine {
  static async buildConfigFrom () {}
}

export const fromCmdLine = async (
  cwd: string,
  argv: string[]
) => {
  const config: CmdLineConfig = { cwd, errors: [], positionals: [] };

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
      if (currentOption.multiple !== true) {
        currentOption = undefined;
      }
    }
  }
  if (currentOption) {
    setOption(config, currentOption);
  }

  const { errors, ...configWithoutErrors } = config;

  let finalConfig: Configuration;
  try {
    finalConfig = await ConfigurationValidator.validate(configWithoutErrors);
  } catch (error) {
    errors.push(error);
  }

  if (errors.length === 1) {
    throw errors[0];
  } else if (errors.length > 0) {
    throw new AggregateError(errors, 'Multiple errors occurred');
  }

  return finalConfig!;
};
