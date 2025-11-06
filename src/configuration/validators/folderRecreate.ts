import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';
import { Platform } from '../../Platform.js';

export const folderRecreate: OptionValidator<'folder-recreate'> = async (option, value, configuration) => {
  if (typeof value !== 'string') {
    throw new OptionValidationError(option, 'Expected string');
  }
  const path = Platform.isAbsolute(value) ? value : Platform.join(configuration.cwd, value);
  try {
    const mode = Platform.fsConstants.R_OK | Platform.fsConstants.W_OK;
    await Platform.access(path, mode);
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error && error.code;
    if (code === 'EACCES') {
      throw new OptionValidationError(option, 'Unable to access folder', error);
    }
    if (code === 'ENOENT') {
      return path;
    }
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
