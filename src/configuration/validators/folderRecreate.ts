import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';
import { Platform } from '../../Platform.js';
import type { Option } from '../Option.js';
import type { Configuration } from '../Configuration.js';

export const fsOption = async (option: Option, value: unknown, configuration: Configuration): Promise<string> => {
  if (typeof value !== 'string') {
    throw new OptionValidationError(option, 'Expected string');
  }
  const path = Platform.isAbsolute(value) ? value : Platform.join(configuration.cwd, value);
  try {
    const mode = Platform.fsConstants.R_OK | (option.type === 'folder-recreate' ? Platform.fsConstants.W_OK : 0);
    await Platform.access(path, mode);
  } catch (error) {
    if (option.type === 'folder-recreate') {
      const code = typeof error === 'object' && error && 'code' in error && error.code;
      if (code === 'EACCES') {
        throw new OptionValidationError(option, 'Unable to access folder', error);
      }
      if (code === 'ENOENT') {
        return path;
      }
    } else {
      throw new OptionValidationError(option, `Unable to access ${option.type}`, error);
    }
  }
  try {
    const stat = await Platform.stat(path);
    if (option.type !== 'file' && !stat.isDirectory()) {
      throw new OptionValidationError(option, 'Not a folder');
    }
    if (option.type === 'file' && !stat.isFile()) {
      throw new OptionValidationError(option, 'Not a file');
    }
  } catch (error) {
    throw new OptionValidationError(option, 'Unable to check type', error);
  }
  return path;
};

export const folderRecreate: OptionValidator<'folder-recreate'> = fsOption;
