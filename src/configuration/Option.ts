export type OptionType =
  | 'string'
  | 'folder'
  | 'file'
  | 'url'
  | 'regexp'
  | 'ui5Mapping'
  | 'reserveMapping'
  | 'boolean'
  | 'timeout'
  | 'integer'
  | 'percent';

export type InferOptionType<T extends OptionType> = T extends 'boolean'
  ? boolean
  : T extends 'timeout' | 'percent'
    ? number
    : T extends 'integer'
      ? number
      : string;

export type Option<T extends OptionType = OptionType> = {
  name: string;
  short?: string;
  description: string;
  type: T;
  multiple?: true;
  default?: InferOptionType<T> | readonly InferOptionType<T>[];
  defaultLabel?: string;
};
