import type { Option, OptionType } from '../Option.js';
import type { OptionValidator } from './OptionValidator.js';
import { OptionValidationError } from '../OptionValidationError.js';
import { boolean } from './boolean.js';
import { file } from './file.js';
import { folderRecreate } from './folderRecreate.js';
import { folder } from './folder.js';
import { integer } from './integer.js';
import { percent } from './percent.js';
import { regexp } from './regexp.js';
import { string } from './string.js';
import { timeout } from './timeout.js';
import { url } from './url.js';

const notImplemented = (option: Option) => {
  throw new OptionValidationError(option, 'Validation not yet implemented');
};

export const validators: { [key in OptionType]: OptionValidator<key> } = {
  boolean,
  file,
  'folder-recreate': folderRecreate,
  folder,
  integer,
  percent,
  regexp,
  reserveMapping: notImplemented,
  string,
  timeout,
  ui5Mapping: notImplemented,
  url
};
