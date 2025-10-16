import type { InferOptionType, Option, OptionType } from '../Option.js';

export type OptionValidator<T extends OptionType> = (
  option: Option<T>,
  value: unknown
) => Promise<InferOptionType<T>> | InferOptionType<T>;
