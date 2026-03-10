export type OptionType =
  | 'boolean'
  | 'browser'
  | 'fs-entry'
  | 'integer'
  | 'percent'
  | 'regexp'
  | 'string'
  | 'timeout'
  | 'url';

export type OptionTypeModifiers = 'exists' | 'file' | 'folder' | 'overwrite' | 'safe-default';

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
  typeModifiers?: Set<OptionTypeModifiers>;
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
