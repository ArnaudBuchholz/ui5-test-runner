import type { Configuration } from './Configuration.js';
import type { Option } from './Option.ts';
import { options } from './options.js';

type ConfigurationKeys = keyof Configuration;

type IndexedOptions = { [key in ConfigurationKeys]: Option } & { [key in string]?: Option };

export const indexedOptions = {} as IndexedOptions;

for (const option of options) {
  const { name } = option;
  indexedOptions[name] = option;
  if ('short' in option) {
    indexedOptions[option.short] = option;
  }
  const kebabCase = name.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLocaleLowerCase()}`);
  if (name !== kebabCase) {
    indexedOptions[kebabCase] = option;
  }
}
