export type OptionType =
  | 'boolean'
  | 'enumeration'
  | 'fs-entry'
  | 'integer'
  | 'json'
  | 'library-mapping'
  | 'percent'
  | 'regexp'
  | 'string'
  | 'timeout'
  | 'url';

export type LibraryMapping = {
  resourcesSubFolder: string;
  sourceFolder: string;
};

export type InferOptionType<T extends OptionType> = T extends 'boolean'
  ? boolean
  : T extends 'json'
    ? Record<string, unknown>
    : T extends 'timeout' | 'percent'
      ? number
      : T extends 'integer'
        ? number
        : T extends 'regexp'
          ? RegExp
          : T extends 'library-mapping'
            ? LibraryMapping
            : string;

export type Option<T extends OptionType = OptionType> = {
  name: string;
  short?: string;
  description: string;
  type: T;
  typeModifiers?: Set<string>;
  defaultLabel?: string;
  browserExposed?: true;
  batchForwarded?: true;
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
