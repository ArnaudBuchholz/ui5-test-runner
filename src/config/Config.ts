import type { InferOptionType, IOption } from './IOption.js';
import { OptionType } from './IOption.js';

export const options = [
  {
    name: 'cwd',
    short: 'c',
    description: 'Set working directory',
    default: process.cwd(),
    defaultLabel: 'current working directory',
    type: OptionType.folder
  },
  {
    name: 'version',
    description: 'Shows version',
    type: OptionType.boolean
  },
  {
    name: 'help',
    description: 'Shows help',
    type: OptionType.boolean
  },
  {
    name: 'capabilities',
    description: 'Run browser tests',
    type: OptionType.boolean
  },
  {
    name: 'url',
    short: 'u',
    description: 'URL of the testsuite / page to test',
    type: OptionType.url,
    multiple: true
  },
  {
    name: 'port',
    short: 'p',
    description: 'Port to use (0 to use any free one)',
    default: 0,
    type: OptionType.integer
  }
] as const;

type HasDefault<T> = T extends { default: unknown } ? true : false;
type ConfigType<T extends IOption> = T['multiple'] extends true
  ? InferOptionType<T['type']>[]
  : InferOptionType<T['type']>;
type ConfigKeys = (typeof options)[number]['name'];
type GetConfig<K extends ConfigKeys> = Extract<(typeof options)[number], { name: K }>;

export type Config = {
  [K in ConfigKeys as HasDefault<GetConfig<K>> extends true ? K : never]: ConfigType<GetConfig<K>>;
} & {
  [K in ConfigKeys as HasDefault<GetConfig<K>> extends true ? never : K]?: ConfigType<GetConfig<K>>;
};
