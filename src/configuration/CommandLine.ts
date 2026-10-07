import { indexedOptions } from './indexedOptions.js';
import type { Configuration } from './Configuration.js';
import { ConfigurationValidator } from './ConfigurationValidator.js';
import type { Option } from './Option.js';
import { OptionValidationError } from './OptionValidationError.js';
import { isLikeAnUrl } from './validators/url.js';
import { assert, Host } from '../platform/index.js';

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
      configuration.errors.push(OptionValidationError.createMissingValue(option));
    }
  } else {
    if (option.multiple) {
      if (!Object.hasOwn(configuration, option.name)) {
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
): Option | undefined => {
  if (currentOption) {
    setOption(configuration, currentOption);
  }
  const option = indexedOptions[name];
  if (option) {
    return option;
  }
  /* v8 ignore next -- @preserve */ // Not intended to be kept long term
  if (Host.env['IGNORE_UNKNOWN_OPTION']) {
    return undefined;
  }
  throw OptionValidationError.createUnknown(name);
};

const positionalOption: Option = {
  name: 'positional',
  description: 'Any argument not prefixed with an option',
  type: 'string'
} as const;

const handlePositional = (configuration: CommandLineConfiguration, value: string) => {
  if (isLikeAnUrl(value)) {
    setOption(configuration, indexedOptions.url, value);
    return;
  }
  const shortcuts = ['version', 'help'] as const;
  for (const shortcut of shortcuts) {
    if (value === shortcut) {
      setOption(configuration, indexedOptions[shortcut]);
      return;
    }
  }
  configuration.errors.push(OptionValidationError.createUnprocessable(positionalOption, value));
};

// Matches negative numbers (e.g. -42, -3.5, -.5) so they are treated as values, not options
const NEGATIVE_NUMBER = /^-\d+$|^-\d*\.\d+$/;

// Consumes an option token (-x or --xxx), returning the option it switches to, or undefined if not an option token
const switchOptionFromToken = (
  configuration: CommandLineConfiguration,
  currentOption: Option | undefined,
  argument: string
): { option: Option | undefined } | undefined => {
  if (argument.startsWith('--')) {
    return { option: switchOption(configuration, currentOption, argument.slice(2)) };
  }
  return argument.startsWith('-')
    ? { option: switchOption(configuration, currentOption, argument.slice(1)) }
    : undefined;
};

const traverseArguments = (configuration: CommandLineConfiguration, argv: string[]) => {
  let currentOption: Option | undefined;
  for (const argument of argv) {
    // A negative number feeds the option currently expecting a value rather than being parsed as an option
    const isValueForCurrentOption = currentOption !== undefined && NEGATIVE_NUMBER.test(argument);
    if (!isValueForCurrentOption) {
      const switched = switchOptionFromToken(configuration, currentOption, argument);
      if (switched) {
        currentOption = switched.option;
        continue;
      }
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
    // Using prototype inheritance, we can have cwd and errors be part of the object without being own keys
    const configuration = Object.create({ cwd, errors: [] }) as CommandLineConfiguration;
    traverseArguments(configuration, argv);
    const cliKeys = new Set(Object.keys(configuration));
    let validatedConfiguration: Configuration | undefined;
    try {
      validatedConfiguration = await ConfigurationValidator.validate(configuration);
    } catch (error) {
      if (configuration.errors.length > 0 && error instanceof AggregateError) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- Cannot change the base type definition of errors
        configuration.errors.push(...error.errors);
      } else {
        configuration.errors.push(error);
      }
    }
    if (configuration.errors.length === 1) {
      throw configuration.errors[0];
    }
    if (configuration.errors.length > 0) {
      throw new AggregateError(configuration.errors, 'Multiple errors occurred');
    }
    assert(validatedConfiguration !== undefined);
    validatedConfiguration.sources = {
      ...validatedConfiguration.sources
    };
    for (const key of cliKeys) {
      validatedConfiguration.sources[key] = 'cli';
    }
    return validatedConfiguration;
  }
};
