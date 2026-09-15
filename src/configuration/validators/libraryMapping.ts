import { OptionValidationError } from '../OptionValidationError.js';
import type { OptionValidator } from './OptionValidator.js';
import { validate } from '../../utils/shared/schema.js';
import { fsOption } from './fsEntry.js';

const libraryMappingSchema = {
  resourcesSubFolder: 'string',
  sourceFolder: 'string'
} as const;

export const lib: OptionValidator<'library-mapping'> = async (option, value, configuration) => {
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
  try {
    validate(value, libraryMappingSchema);
  } catch {
    throw OptionValidationError.createInvalidValue(option);
  }
  const { resourcesSubFolder, sourceFolder } = value as { resourcesSubFolder: string; sourceFolder: string };
  const validatedSourceFolder = await fsOption(option, sourceFolder, configuration);
  return { resourcesSubFolder, sourceFolder: validatedSourceFolder };
};
