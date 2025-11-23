import { indexedOptions } from './indexedOptions.js';
import type { Configuration } from './Configuration.js';
import { ConfigurationValidator } from './ConfigurationValidator.js';
import type { Option } from './Option.js';
import { OptionValidationError } from './OptionValidationError.js';
import { looksLikeAnUrl } from './validators/url.js';

type ConfigurationKeys = keyof Configuration;

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

const setOption = (configuration: CommandLineConfiguration, option: Option, value?: string) => {
  const name = option.name as keyof Configuration;
  if (value === undefined) {
    if (option.type === 'boolean') {
      Object.assign(configuration, {
        [name]: true
      });
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
  }
};

const switchOption = (
  configuration: CommandLineConfiguration,
  currentOption: Option | undefined,
  name: string
): Option => {
  if (currentOption) {
    setOption(configuration, currentOption);
  }
  const option = indexedOptions[name];
  if (!option) {
    throw OptionValidationError.createUnknown(name);
  }
  return option;
};

const positionalOption: Option = {
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
  let currentOption: Option | undefined;
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
