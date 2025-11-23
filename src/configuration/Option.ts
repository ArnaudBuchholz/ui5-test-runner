export type OptionType =
  | 'boolean'
  | 'file'
  | 'folder-recreate'
  | 'folder'
  | 'integer'
  | 'percent'
  | 'regexp'
  | 'reserveMapping'
  | 'string'
  | 'timeout'
  | 'ui5Mapping'
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
