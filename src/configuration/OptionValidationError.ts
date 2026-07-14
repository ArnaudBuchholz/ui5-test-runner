import type { Option } from './Option.js';

export class OptionValidationError extends Error {
  static createInvalidValue(option: Option) {
    return new OptionValidationError(option, 'Invalid value');
  }

  static createUnknown(name: string) {
    return new OptionValidationError({ name, type: 'string', description: 'unknown' }, `Unknown option ${name}`);
  }

  static createShortName(option: Option) {
    return new OptionValidationError(option, 'Do not use short name');
  }

  static createKebabCase(option: Option) {
    return new OptionValidationError(option, 'Do not use kebab-case');
  }

  static createMissingValue(option: Option) {
    return new OptionValidationError(option, 'Missing value');
  }

  static createUnprocessable(option: Option, value: string) {
    return new OptionValidationError(option, `Unable to process: ${value}`);
  }

  static createInvalidRegexp(option: Option, cause: unknown) {
    return new OptionValidationError(option, 'Invalid regexp', cause);
  }

  static createFsAccessError(option: Option, cause: unknown) {
    return new OptionValidationError(option, 'Unable to access file system entry', cause);
  }

  static createFsNotFolder(option: Option) {
    return new OptionValidationError(option, 'Not a folder');
  }

  static createFsNotFile(option: Option) {
    return new OptionValidationError(option, 'Not a file');
  }

  static createFsCheckTypeError(option: Option, cause: unknown) {
    return new OptionValidationError(option, 'Unable to check type', cause);
  }

  static createFsExpectedString(option: Option) {
    return new OptionValidationError(option, 'Expected string');
  }

  static createConfigNestingDepth(option: Option, maxDepth: number) {
    return new OptionValidationError(option, `config file nesting exceeded maximum depth of ${maxDepth}`);
  }

  static createConfigReadError(option: Option, path: string, cause: unknown) {
    return new OptionValidationError(option, `cannot read config file ${path}`, cause);
  }

  static createConfigInvalidJson(option: Option, path: string, cause: unknown) {
    return new OptionValidationError(option, `config file ${path} is not valid JSON`, cause);
  }

  static createConfigNotObject(option: Option, path: string) {
    return new OptionValidationError(option, `config file ${path} must be a JSON object`);
  }

  private _option: Option;

  private constructor(option: Option, message: string, cause?: unknown) {
    super(message);
    this._option = option;
    this.name = 'OptionValidationError';
    this.cause = cause;
  }

  get option() {
    return this._option;
  }
}
