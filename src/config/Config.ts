import { InferOptionType } from './IOption.js';

export const options = [
  {
    name: 'cwd',
    short: 'c',
    description: 'Set working directory',
    default: process.cwd(),
    defaultLabel: 'current working directory',
    type: 'folder'
  },
  {
    name: 'port',
    short: 'p',
    description: 'Port to use (0 to use any free one)',
    default: 0,
    type: 'integer'
  }
] as const;

export type Config = {
  [K in (typeof options)[number]['name']]: InferOptionType<
    Extract<(typeof options)[number], { name: K }>['type']
  >;
};  
