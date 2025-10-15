import { options } from './options.js';
import type { Configuration } from './Configuration.js';
import { ConfigurationValidator } from './ConfigurationValidator.js';
import type { IOption } from './IOption.js';
import { OptionValidationError } from './OptionValidationError.js';
import { looksLikeAnUrl } from './validators/url.js';

type ConfigurationKeys = keyof Configuration;

type IndexedOptions = { [key in ConfigurationKeys]: IOption } & { [key in string]?: IOption };
const indexedOptions = {} as IndexedOptions;
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

// The command line config contains mostly strings (or array of strings for multiple params)
export type CommandLineConfiguration = {
  [K in ConfigurationKeys as Configuration[K] extends string[] | undefined ? K : never]?: string[];
} & {
  [K in ConfigurationKeys as Configuration[K] extends boolean | undefined ? K : never]?: string | boolean;
} & {
  [K in ConfigurationKeys as Configuration[K] extends string[] | boolean | undefined ? never : K]?: string;
} & {
  errors: unknown[];
};

const setOption = (configuration: CommandLineConfiguration, option: IOption, value?: string) => {
  const name = option.name as keyof Configuration;
  let set = false;
  if (value === undefined) {
    if (option.type === 'boolean') {
      Object.assign(configuration, {
        [name]: true
      });
      set = true;
    } else if (option.multiple !== true) {
      configuration.errors.push(new OptionValidationError(option, 'Missing value'));
    }
  } else {
    if (option.multiple) {
      if (!(option.name in configuration)) {
        Object.assign(configuration, {
          [name]: []
        });
      }
      (configuration[name] as string[]).push(value);
    } else {
      Object.assign(configuration, {
        [name]: value
      });
    }
    set = true;
  }
  if (set && option.default !== undefined) {
    Object.assign(configuration, {
      [`${name}Set`]: true
    });
  }
};

const switchOption = (
  configuration: CommandLineConfiguration,
  currentOption: IOption | undefined,
  name: string
): IOption => {
  if (currentOption) {
    setOption(configuration, currentOption);
  }
  const option = indexedOptions[name];
  if (!option) {
    throw new OptionValidationError({ name, type: 'string', description: 'unknown' }, 'Unknown option');
  }
  return option;
};

const positionalOption: IOption = {
  name: 'positional',
  description: 'Any argument not prefixed with an option',
  type: 'string'
} as const;

const handlePositional = (configuration: CommandLineConfiguration, value: string) => {
  if (looksLikeAnUrl(value)) {
    setOption(configuration, indexedOptions.url, value);
    return;
  }
  const shortcuts = ['capabilities', 'version', 'help'] as const;
  for (const shortcut of shortcuts) {
    if (value === shortcut) {
      setOption(configuration, indexedOptions[shortcut]);
      return;
    }
  }
  configuration.errors.push(new OptionValidationError(positionalOption, `Unable to process: ${value}`));
};

const traverseArguments = (configuration: CommandLineConfiguration, argv: string[]) => {
  let currentOption: IOption | undefined;
  for (const argument of argv) {
    if (argument.startsWith('--')) {
      currentOption = switchOption(configuration, currentOption, argument.slice(2));
      continue;
    }
    if (argument.startsWith('-')) {
      currentOption = switchOption(configuration, currentOption, argument.slice(1));
      continue;
    }
    if (currentOption === undefined) {
      handlePositional(configuration, argument);
    } else {
      setOption(configuration, currentOption, argument);
      if (currentOption.multiple !== true) {
        currentOption = undefined;
      }
    }
  }
  if (currentOption) {
    setOption(configuration, currentOption);
  }
};

export const CommandLine = {
  async buildConfigurationFrom(cwd: string, argv: string[]) {
    const configuration: CommandLineConfiguration = { cwd, errors: [] };

    traverseArguments(configuration, argv);

    const { errors, ...configWithoutErrors } = configuration;

    let validatedConfiguration: Configuration;
    try {
      validatedConfiguration = await ConfigurationValidator.validate(configWithoutErrors);
    } catch (error) {
      if (errors.length > 0 && error instanceof AggregateError) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Cannot change the base type definition of errors
        errors.push(...error.errors);
      } else {
        errors.push(error);
      }
    }

    if (errors.length === 1) {
      throw errors[0];
    } else if (errors.length > 0) {
      throw new AggregateError(errors, 'Multiple errors occurred');
    }

    return validatedConfiguration!;
  }
};
