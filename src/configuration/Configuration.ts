import type { Modes } from './Modes.js';
import type { InferOptionType, Option } from './Option.js';
import type { options } from './options.js';

type HasDefault<T> = T extends { default: unknown } ? true : false;
type ConfigType<T extends Option> = T['multiple'] extends true
  ? InferOptionType<T['type']>[]
  : InferOptionType<T['type']>;
type ConfigKeys = (typeof options)[number]['name'];
type GetConfig<K extends ConfigKeys> = Extract<(typeof options)[number], { name: K }>;

export type Configuration = {
  [K in ConfigKeys as HasDefault<GetConfig<K>> extends true ? K : never]: ConfigType<GetConfig<K>>;
} & {
  [K in ConfigKeys as HasDefault<GetConfig<K>> extends true ? never : K]?: ConfigType<GetConfig<K>>;
} & {
  mode: Modes;
};
