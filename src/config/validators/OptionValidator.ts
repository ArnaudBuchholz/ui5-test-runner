import type { InferOptionType, IOption, OptionType } from '../IOption.js';

export type OptionValidator<T extends OptionType> = (
  option: IOption<T>,
  value: unknown
) => Promise<InferOptionType<T>> | InferOptionType<T>;
