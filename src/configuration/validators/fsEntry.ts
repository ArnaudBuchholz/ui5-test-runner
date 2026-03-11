import { FileSystem, Host, Path } from '../../platform/index.js';
import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';
import type { Option } from '../Option.js';
import type { Configuration } from '../Configuration.js';

const fsCheckAccess = async (option: Option, path: string): Promise<string | undefined> => {
  const overwrite = option.typeModifiers?.has('overwrite') ?? false;
  try {
    const mode = FileSystem.constants.R_OK | (overwrite ? FileSystem.constants.W_OK : 0);
    await FileSystem.access(path, mode);
  } catch (error) {
    if (overwrite) {
      const code = typeof error === 'object' && error && 'code' in error && error.code;
      if (code === 'EACCES') {
        throw new OptionValidationError(option, 'Unable to access file system entry', error);
      }
      if (code === 'ENOENT') {
        return path; // will be created
      }
    } else {
      throw new OptionValidationError(option, `Unable to access file system entry`, error);
    }
  }
  return undefined;
};

const fsCheckStat = async (option: Option, path: string): Promise<void> => {
  const file = option.typeModifiers?.has('file') ?? false;
  try {
    const stat = await FileSystem.stat(path);
    if (!file && !stat.isDirectory()) {
      throw new OptionValidationError(option, 'Not a folder');
    }
    if (file && !stat.isFile()) {
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
  let path: string;
  if (Path.isAbsolute(value)) {
    path = value;
  } else if (option.name === 'cwd') {
    path = Path.join(Host.cwd(), value);
  } else {
    path = Path.join(configuration.cwd, value);
  }
  try {
    const accessChecked = await fsCheckAccess(option, path);
    if (accessChecked !== undefined) {
      return accessChecked;
    }
    await fsCheckStat(option, path);
  } catch (error) {
    if (
      option.typeModifiers?.has('safe-default') &&
      !Object.prototype.hasOwnProperty.call(configuration, option.name)
    ) {
      return '';
    }
    throw error;
  }
  return path;
};

export const fsEntry: OptionValidator<'fs-entry'> = fsOption;
