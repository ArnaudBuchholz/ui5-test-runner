import type { OptionType } from '../Option.js';
import type { OptionValidator } from './OptionValidator.js';
import { boolean } from './boolean.js';
import { timeout } from './timeout.js';
import { folder } from './folder.js';
import { folderRecreate } from './folderRecreate.js';

export const validators: { [key in OptionType]: OptionValidator<key> } = {
  boolean,
  timeout,
  folder,
  'folder-recreate': folderRecreate,
};
