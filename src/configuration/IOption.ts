export type OptionType = 'string' | 'folder' | 'file' | 'url' | 'boolean' | 'timeout' | 'integer';

export type InferOptionType<T extends OptionType> = T extends 'boolean'
  ? boolean
  : T extends 'timeout'
    ? number
    : T extends 'integer'
      ? number
      : string;

export interface IOption<T extends OptionType = OptionType> {
  name: string;
  short?: string;
  description: string;
  type: T;
  multiple?: true;
  default?: InferOptionType<T>;
  defaultLabel?: string;
}
