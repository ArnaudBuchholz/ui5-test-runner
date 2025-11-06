import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';
import { Platform } from '../../Platform.js';

export const file: OptionValidator<'file'> = async (option, value, configuration) => {
  if (typeof value !== 'string') {
    throw new OptionValidationError(option, 'Expected string');
  }
  const path = Platform.isAbsolute(value) ? value : Platform.join(configuration.cwd, value);
  try {
    const mode = Platform.fsConstants.R_OK;
    await Platform.access(path, mode);
  } catch (error) {
    throw new OptionValidationError(option, 'Unable to access file', error);
  }
  try {
    const stat = await Platform.stat(path);
    if (!stat.isFile()) {
      throw new OptionValidationError(option, 'Not a file');
    }
  } catch (error) {
    throw new OptionValidationError(option, 'Unable to check type', error);
  }
  return path;
};
