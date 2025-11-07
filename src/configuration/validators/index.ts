import type { OptionType } from '../Option.js';
import type { OptionValidator } from './OptionValidator.js';
import { boolean } from './boolean.js';
import { file } from './file.js';
import { folder } from './folder.js';
import { folderRecreate } from './folderRecreate.js';
import { percent } from './percent.js';
import { string } from './string.js';
import { timeout } from './timeout.js';

export const validators: { [key in OptionType]: OptionValidator<key> } = {
  boolean,
  file,
  folder,
  'folder-recreate': folderRecreate,
  percent,
  string,
  timeout
};
