import type { Option } from './Option.js';

export class OptionValidationError extends Error {
  constructor(
    private _option: Option,
    message: string = 'Invalid value'
  ) {
    super(message);
    this.name = 'OptionValidationError';
  }

  get option() {
    return this._option;
  }
}
