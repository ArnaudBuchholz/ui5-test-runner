import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';
import { validate } from '../../utils/shared/schema.js';

const libraryMappingSchema = {
  resourcesSubFolder: 'string',
  sourceFolder: 'string'
} as const;

export const lib: OptionValidator<'lib'> = (option, value) => {
  if (typeof value === 'string') {
    const [resourcesSubFolder, sourceFolder, extra] = value.split('=', 3);
    if (extra) {
      throw OptionValidationError.createInvalidValue(option);
    }
    value = {
      resourcesSubFolder,
      sourceFolder: sourceFolder ?? resourcesSubFolder
    };
  }
  validate(value, libraryMappingSchema);
  return value;
};
