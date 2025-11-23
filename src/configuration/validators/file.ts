import type { OptionValidator } from './OptionValidator.js';
import { fsOption } from './folderRecreate.js';

export const file: OptionValidator<'file'> = fsOption;
