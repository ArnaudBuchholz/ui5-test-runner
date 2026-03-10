import type { OptionType } from '../Option.js';
import type { OptionValidator } from './OptionValidator.js';
import { boolean } from './boolean.js';
import { browser } from './browser.js';
import { fsEntry } from './fsEntry.js';
import { integer } from './integer.js';
import { percent } from './percent.js';
import { regexp } from './regexp.js';
import { string } from './string.js';
import { timeout } from './timeout.js';
import { url } from './url.js';

export const validators: { [key in OptionType]: OptionValidator<key> } = {
  boolean,
  browser,
  'fs-entry': fsEntry,
  integer,
  percent,
  regexp,
  string,
  timeout,
  url
};
