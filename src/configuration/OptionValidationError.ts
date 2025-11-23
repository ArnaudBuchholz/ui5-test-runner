import type { Option } from './Option.js';

export class OptionValidationError extends Error {
  static createUnknown(name: string) {
    return new OptionValidationError({ name, type: 'string', description: 'unknown' }, 'Unknown option');
  }

  constructor(
    private _option: Option,
    message: string = 'Invalid value',
    cause?: unknown
  ) {
    super(message);
    this.name = 'OptionValidationError';
    this.cause = cause;
  }

  get option() {
    return this._option;
  }
}
