import type { OptionValidator } from './OptionValidator.js';
import { fsOption } from './folderRecreate.js';

export const folder: OptionValidator<'folder'> = fsOption;
