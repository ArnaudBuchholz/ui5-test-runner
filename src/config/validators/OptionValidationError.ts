import type { IOption } from '../IOption.js';

export class OptionValidationError extends Error {
  constructor(
    private _option: IOption,
    message: string = 'Invalid value'
  ) {
    super(message);
    this.name = 'OptionValidationError';
  }

  get option() {
    return this._option;
  }
}
