import type { Configuration } from './Configuration.js';
import { options, defaults } from './options.js';
import { indexedOptions } from './indexedOptions.js';
import { validators } from './validators/index.js';
import { OptionValidationError } from './OptionValidationError.js';
import { Modes } from '../modes/Modes.js';
import { FileSystem, Host, Path } from '../platform/index.js';

const MAX_CONFIG_DEPTH = 10;

const assertIfConfiguration: (value: object) => asserts value is Configuration = (value) => {
  const errors: OptionValidationError[] = [];
  for (const key of Object.keys(value)) {
    const option = indexedOptions[key];
    if (option) {
      if (key === option.short) {
        errors.push(OptionValidationError.createShortName(option));
      } else if (key !== option.name) {
        errors.push(OptionValidationError.createKebabCase(option));
      }
    } else if (!Host.env['IGNORE_UNKNOWN_OPTION']) {
      errors.push(OptionValidationError.createUnknown(key));
    }
  }
  if (errors.length > 1) {
    throw new AggregateError(errors, 'Unknown keys');
  }
  const [error] = errors;
  if (error) {
    throw error;
  }
};

const validateValue = async (option: (typeof options)[number], configuration: Configuration) => {
  const value = configuration[option.name];
  if ('multiple' in option) {
    const validatedValues = [];
    if (Array.isArray(value)) {
      for (const valueItem of value) {
        validatedValues.push(await validators[option.type](option, valueItem, configuration));
      }
    } else {
      validatedValues.push(await validators[option.type](option, value, configuration));
    }
    return validatedValues;
  }
  return await validators[option.type](option, value, configuration);
};

const loadConfigFile = async (configPath: string): Promise<Record<string, unknown>> => {
  let content: string;
  try {
    content = await FileSystem.readFile(configPath, 'utf8');
  } catch (error) {
    throw OptionValidationError.createConfigReadError(indexedOptions.config, configPath, error);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw OptionValidationError.createConfigInvalidJson(indexedOptions.config, configPath, error);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw OptionValidationError.createConfigNotObject(indexedOptions.config, configPath);
  }
  return parsed as Record<string, unknown>;
};

const extractConfigEntries = (parsed: Record<string, unknown>, configDirectory: string) => {
  const forcedKeys = new Set<string>();
  const configFileKeys = new Set<string>();
  const configFileObject: Record<string, unknown> = {};
  for (const [rawKey, value] of Object.entries(parsed)) {
    const key = rawKey.startsWith('!') ? rawKey.slice(1) : rawKey;
    if (rawKey.startsWith('!')) {
      forcedKeys.add(key);
    }
    configFileObject[key] = value;
    configFileKeys.add(key);
  }
  if (configFileKeys.has('cwd')) {
    const rawCwd = configFileObject['cwd'] as string;
    if (!Path.isAbsolute(rawCwd)) {
      configFileObject['cwd'] = Path.join(configDirectory, rawCwd);
    }
  } else {
    configFileObject['cwd'] = configDirectory;
  }
  return { forcedKeys, configFileKeys, configFileObject };
};

export const ConfigurationValidator = {
  async merge(configuration: Configuration, explicitKeys: Set<string>, depth: number): Promise<Configuration> {
    if (!configuration.config || !Path.isAbsolute(configuration.config)) {
      return configuration;
    }
    if (depth >= MAX_CONFIG_DEPTH) {
      throw OptionValidationError.createConfigNestingDepth(indexedOptions.config, MAX_CONFIG_DEPTH);
    }
    const parsed = await loadConfigFile(configuration.config);
    const configDirectory = Path.dirname(configuration.config);
    const { forcedKeys, configFileKeys, configFileObject } = extractConfigEntries(parsed, configDirectory);
    const fileConfig = await this.validate(configFileObject, depth + 1);
    for (const [key, value] of Object.entries(fileConfig)) {
      if (key === 'mode' || key === 'config') {
        continue;
      }
      if (key === 'cwd' && !configFileKeys.has('cwd')) {
        continue;
      }
      if (forcedKeys.has(key) || !explicitKeys.has(key)) {
        Object.assign(configuration, { [key]: value });
        configuration.sources[key as keyof Configuration['sources']] = 'config';
      }
    }
    return configuration;
  },

  computeMode(configuration: Configuration): Modes {
    if (configuration.help) {
      return Modes.help;
    }
    if (configuration.version) {
      return Modes.version;
    }
    if (configuration.batch) {
      return Modes.batch;
    }
    if (configuration.log) {
      return Modes.log;
    }
    if (configuration.url) {
      return Modes.remote;
    }
    return Modes.legacy;
  },

  async validate(configuration: object, depth = 0): Promise<Configuration> {
    const withDefaults = Object.assign(Object.create(defaults), configuration) as object;
    assertIfConfiguration(withDefaults);
    const explicitKeys = new Set(Object.keys(withDefaults));
    for (const option of options) {
      if (
        Object.hasOwn(withDefaults, option.name) ||
        (depth === 0 && withDefaults[option.name] && option.type === 'fs-entry')
      ) {
        Object.assign(withDefaults, {
          [option.name]: await validateValue(option, withDefaults)
        });
      }
    }
    if (!Object.hasOwn(withDefaults, 'sources')) {
      Object.assign(withDefaults, { sources: {} });
    }
    if (Host.env['UI5TR_BATCH_MODE']) {
      Object.assign(withDefaults, { outputInterval: 1000 });
    }
    const merged = await this.merge(withDefaults, explicitKeys, depth);
    merged.mode = this.computeMode(merged);
    return merged;
  }
};
