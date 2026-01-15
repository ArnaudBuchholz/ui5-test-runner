import { FileSystem, Path } from '../../platform/index.js';
import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';
import type { Option } from '../Option.js';
import type { Configuration } from '../Configuration.js';

const fsCheckAccess = async (option: Option, path: string): Promise<string | undefined> => {
  try {
    const mode = FileSystem.constants.R_OK | (option.type === 'folder-recreate' ? FileSystem.constants.W_OK : 0);
    await FileSystem.access(path, mode);
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
  return undefined;
};

const fsCheckStat = async (option: Option, path: string): Promise<void> => {
  try {
    const stat = await FileSystem.stat(path);
    if (option.type !== 'file' && !stat.isDirectory()) {
      throw new OptionValidationError(option, 'Not a folder');
    }
    if (option.type === 'file' && !stat.isFile()) {
      throw new OptionValidationError(option, 'Not a file');
    }
  } catch (error) {
    throw new OptionValidationError(option, 'Unable to check type', error);
  }
};

export const fsOption = async (option: Option, value: unknown, configuration: Configuration): Promise<string> => {
  if (typeof value !== 'string') {
    throw new OptionValidationError(option, 'Expected string');
  }
  const path = Path.isAbsolute(value) ? value : Path.join(configuration.cwd, value);
  const accessChecked = await fsCheckAccess(option, path);
  if (accessChecked !== undefined) {
    return accessChecked;
  }
  await fsCheckStat(option, path);
  return path;
};

export const folderRecreate: OptionValidator<'folder-recreate'> = fsOption;
