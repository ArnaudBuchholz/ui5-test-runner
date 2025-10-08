import type { InferOptionType, IOption, OptionType } from '../IOption.js';

export type OptionValidator = (option: IOption, value: unknown) => Promise<InferOptionType<OptionType>>;
