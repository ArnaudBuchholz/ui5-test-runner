import type { Configuration } from './Configuration.js';
import { options, defaults } from './options.js';
import { indexedOptions } from './indexedOptions.js';
import { validators } from './validators/index.js';
import { OptionValidationError } from './OptionValidationError.js';
import { Modes } from '../modes/Modes.js';
import { FileSystem, Path } from '../platform/index.js';

const MAX_CONFIG_DEPTH = 10;

const assertIfConfiguration: (value: object) => asserts value is Configuration = (value) => {
  const errors: OptionValidationError[] = [];
  for (const key of Object.keys(value)) {
    const option = indexedOptions[key];
    if (option) {
      if (key === option.short) {
        errors.push(new OptionValidationError(option, 'Do not use short name'));
      } else if (key !== option.name) {
        errors.push(new OptionValidationError(option, 'Do not use kebab-case'));
      }
    } else {
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

export const ConfigurationValidator = {
  async merge(configuration: Configuration, explicitKeys: Set<string>, depth: number): Promise<Configuration> {
    if (!configuration.config || !Path.isAbsolute(configuration.config)) {
      return configuration;
    }
    if (depth >= MAX_CONFIG_DEPTH) {
      throw new OptionValidationError(indexedOptions.config, `config file nesting exceeded maximum depth of ${MAX_CONFIG_DEPTH}`);
    }
    let content: string;
    try {
      content = await FileSystem.readFile(configuration.config, 'utf-8');
    } catch (error) {
      throw new OptionValidationError(indexedOptions.config, `cannot read config file ${configuration.config}`, error);
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      throw new OptionValidationError(indexedOptions.config, `config file ${configuration.config} is not valid JSON`, error);
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new OptionValidationError(indexedOptions.config, `config file ${configuration.config} must be a JSON object`);
    }

    const forcedKeys = new Set<string>();
    const configFileKeys = new Set<string>();
    const configFileObject: Record<string, unknown> = {};
    for (const [rawKey, value] of Object.entries(parsed as Record<string, unknown>)) {
      const key = rawKey.startsWith('!') ? rawKey.slice(1) : rawKey;
      if (rawKey.startsWith('!')) {
        forcedKeys.add(key);
      }
      configFileObject[key] = value;
      configFileKeys.add(key);
    }
    const configFileDir = Path.dirname(configuration.config);
    if (configFileKeys.has('cwd')) {
      const rawCwd = configFileObject['cwd'] as string;
      if (!Path.isAbsolute(rawCwd)) {
        configFileObject['cwd'] = Path.join(configFileDir, rawCwd);
      }
    } else {
      configFileObject['cwd'] = configFileDir;
    }
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
      if (Object.hasOwn(withDefaults, option.name) || (depth === 0 && withDefaults[option.name] && option.type === 'fs-entry')) {
        Object.assign(withDefaults, {
          [option.name]: await validateValue(option, withDefaults as Configuration)
        });
      }
    }
    const merged = await this.merge(withDefaults as Configuration, explicitKeys, depth);
    merged.mode = this.computeMode(merged);
    return merged;
  }
};
