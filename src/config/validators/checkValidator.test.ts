import { describe, it, expect } from 'vitest';
import type { IOption, OptionType } from '../IOption.js';
import type { OptionValidator } from './OptionValidator.js';
import { OptionValidationError } from '../OptionValidationError.js';

export const checkValidator = <T extends OptionType>({
  validator,
  option,
  valid,
  invalid
}: {
  validator: OptionValidator<T>;
  option: IOption<T>;
  valid: { value: unknown; expected: unknown }[];
  invalid: { value: unknown; message?: string }[];
}) => {
  describe(`validators/${validator.name}`, () => {
    for (const { value, expected } of valid) {
      it(`converts ${JSON.stringify(value)} to ${JSON.stringify(expected)}`, async () => {
        const result = await validator(option, value);
        expect(result).toStrictEqual(expected);
      });
    }
    for (const { value, message } of invalid) {
      it(`rejects ${JSON.stringify(value)}`, async () => {
        try {
          await validator(option, value);
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
