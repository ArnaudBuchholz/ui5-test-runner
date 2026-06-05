export type OptionType =
  | 'boolean'
  | 'browser'
  | 'enumeration'
  | 'fs-entry'
  | 'integer'
  | 'percent'
  | 'regexp'
  | 'string'
  | 'timeout'
  | 'url';

export type InferOptionType<T extends OptionType> = T extends 'boolean'
  ? boolean
  : T extends 'timeout' | 'percent'
    ? number
    : T extends 'integer'
      ? number
      : T extends 'regexp'
        ? RegExp
        : string;

export type Option<T extends OptionType = OptionType> = {
  name: string;
  short?: string;
  description: string;
  type: T;
  typeModifiers?: Set<string>;
  defaultLabel?: string;
} & (
  | {
      multiple?: false;
      default?: InferOptionType<T>;
    }
  | {
      multiple: true;
      default?: readonly InferOptionType<T>[];
    }
);
