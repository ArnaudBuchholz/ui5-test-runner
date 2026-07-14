import { FileSystem, Host, Path } from '../../platform/index.js';
import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';
import type { Option } from '../Option.js';
import type { Configuration } from '../Configuration.js';

const fsCheckAccess = async (option: Option, path: string): Promise<string | undefined> => {
  const isOverwrite = option.typeModifiers?.has('overwrite') ?? false;
  try {
    const mode = FileSystem.constants.R_OK | (isOverwrite ? FileSystem.constants.W_OK : 0);
    await FileSystem.access(path, mode);
  } catch (error) {
    if (isOverwrite) {
      const code = typeof error === 'object' && error && 'code' in error && error.code;
      if (code === 'EACCES') {
        throw OptionValidationError.createFsAccessError(option, error);
      }
      if (code === 'ENOENT') {
        return path; // will be created
      }
    } else {
      throw OptionValidationError.createFsAccessError(option, error);
    }
  }
  return undefined;
};

const fsCheckStat = async (option: Option, path: string): Promise<void> => {
  const isFile = option.typeModifiers?.has('file') ?? false;
  try {
    const stat = await FileSystem.stat(path);
    if (!isFile && !stat.isDirectory()) {
      throw OptionValidationError.createFsNotFolder(option);
    }
    if (isFile && !stat.isFile()) {
      throw OptionValidationError.createFsNotFile(option);
    }
  } catch (error) {
    throw OptionValidationError.createFsCheckTypeError(option, error);
  }
};

export const fsOption = async (option: Option, value: unknown, configuration: Configuration): Promise<string> => {
  if (typeof value !== 'string') {
    throw OptionValidationError.createFsExpectedString(option);
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
