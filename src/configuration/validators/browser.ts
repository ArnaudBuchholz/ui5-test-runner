import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';

const KNOWN_BROWSERS = new Set(['puppeteer']);

export const browser: OptionValidator<'browser'> = (option, value) => {
  if (typeof value === 'string') {
    const name = value.startsWith('$/') && value.endsWith('.js') ? value.slice(2, -3) : value;
    if (KNOWN_BROWSERS.has(name)) {
      return name;
    }
  }
  throw new OptionValidationError(option);
};
