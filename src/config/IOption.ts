export const OptionType = {
  string: 'string',
  folder: 'folder',
  file: 'file',
  url: 'url',
  boolean: 'boolean',
  timeout: 'timeout',
  integer: 'integer'
} as const;

export type OptionType = (typeof OptionType)[keyof typeof OptionType];

export type InferOptionType<T extends OptionType> =
  T extends 'boolean'
  ? boolean
  : T extends 'timeout'
    ? string | number
    : T extends 'integer'
      ? number
      : string;

export interface IOption<T extends OptionType = OptionType> {
  name: string;
  short?: string;
  description: string;
  type: T;
  multiple?: true;
  default: InferOptionType<T>;
  defaultLabel?: string;
}
