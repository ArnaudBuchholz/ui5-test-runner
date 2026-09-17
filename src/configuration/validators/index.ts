import type { OptionType } from '../Option.js';
import type { OptionValidator } from './OptionValidator.js';
import { boolean } from './boolean.js';
import { enumeration } from './enumeration.js';
import { fsEntry } from './fsEntry.js';
import { integer } from './integer.js';
import { json } from './json.js';
import { lib } from './libraryMapping.js';
import { percent } from './percent.js';
import { regexp } from './regexp.js';
import { string } from './string.js';
import { timeout } from './timeout.js';
import { url } from './url.js';

export const validators: { [key in OptionType]: OptionValidator<key> } = {
  boolean,
  enumeration,
  'fs-entry': fsEntry,
  integer,
  json,
  'library-mapping': lib,
  percent,
  regexp,
  string,
  timeout,
  url
};
