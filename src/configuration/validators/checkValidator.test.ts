import { describe, it, expect } from 'vitest';
import type { Option, OptionType } from '../Option.js';
import type { OptionValidator } from './OptionValidator.js';
import { OptionValidationError } from '../OptionValidationError.js';
import type { Configuration } from '../Configuration.js';

export const checkValidator = <T extends OptionType>({
  validator,
  option,
  valid,
  invalid
}: {
  validator: OptionValidator<T>;
  option: Option<T>;
  configuration?: Partial<Configuration>;
  valid: { value: unknown; configuration?: Partial<Configuration>, expected: unknown }[];
  invalid: { value: unknown; configuration?: Partial<Configuration>, message?: string }[];
}) => {
  describe(`validators/${validator.name}`, () => {
    for (const { value, configuration = {}, expected } of valid) {
      it(`converts ${JSON.stringify(value)} to ${JSON.stringify(expected)}`, async () => {
        const result = await validator(option, value, configuration as Configuration);
        expect(result).toStrictEqual(expected);
      });
    }
    for (const { value, configuration = {}, message } of invalid) {
      it(`rejects ${JSON.stringify(value)}`, async () => {
        try {
          await validator(option, value, configuration as Configuration);
          expect.unreachable();
        } catch (error) {
          expect(error).toBeInstanceOf(OptionValidationError);
          if (error instanceof OptionValidationError) {
            expect(error.option).toStrictEqual(option);
            if (message) {
              expect(error.message).toStrictEqual(message);
            }
          }
        }
      });
    }
  });
};
