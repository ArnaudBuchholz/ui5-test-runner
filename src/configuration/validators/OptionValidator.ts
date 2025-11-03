import type { InferOptionType, Option, OptionType } from '../Option.js';
import type { Configuration } from '../Configuration.js';

export type OptionValidator<T extends OptionType> = (
  option: Option,
  value: unknown,
  configuration: Configuration
) => Promise<InferOptionType<T>> | InferOptionType<T>;
