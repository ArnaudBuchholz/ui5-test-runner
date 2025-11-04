import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';
import { Platform } from '../../Platform.js';

export const folder: OptionValidator<'folder'> = async (option, value, configuration) => {
  if (typeof value !== 'string') {
    throw new OptionValidationError(option, 'Expected string');
  }
  const path = Platform.isAbsolute(value) ? value : Platform.join(configuration.cwd, value);
  try {
    const mode = Platform.fsConstants.R_OK;
    // if (write) {
    //   mode |= constants.W_OK
    // }
    await Platform.access(path, mode);
  } catch (error) {
    throw new OptionValidationError(option, 'Unable to access folder', error);
  }
  try {
    const stat = await Platform.stat(path);
    if (!stat.isDirectory()) {
      throw new OptionValidationError(option, 'Not a folder');
    }
  } catch (error) {
    throw new OptionValidationError(option, 'Unable to check type', error);
  }
  return path;
};
