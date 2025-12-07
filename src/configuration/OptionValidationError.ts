import type { Option } from './Option.js';

export class OptionValidationError extends Error {
  static createUnknown(name: string) {
    return new OptionValidationError({ name, type: 'string', description: 'unknown' }, 'Unknown option');
  }

  private _option: Option;

  constructor(
    option: Option,
    message: string = 'Invalid value',
    cause?: unknown
  ) {
    super(message);
    this._option = option;
    this.name = 'OptionValidationError';
    this.cause = cause;
  }

  get option() {
    return this._option;
  }
}
