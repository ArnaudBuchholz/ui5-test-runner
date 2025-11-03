import { describe, it, expect } from 'vitest';
import type { Option, OptionType } from '../Option.js';
import type { OptionValidator } from './OptionValidator.js';
import { OptionValidationError } from '../OptionValidationError.js';
import type { Configuration } from '../Configuration.js';

type InvalidValues = { value: unknown; configuration?: Partial<Configuration>; message?: string }[];

export const invalidValues: InvalidValues = [
  { value: null },
  { value: Symbol('symbol') },
  { value: () => {} },
  { value: Number.POSITIVE_INFINITY },
  { value: Number.NEGATIVE_INFINITY }
] as const;

export const noIntegers: InvalidValues = [{ value: 0 }, { value: 1 }, { value: -1 }];

export const noNumbers: InvalidValues = [{ value: 0.5 }, { value: -0.5 }, { value: 1.5 }, { value: -1.5 }];

export const noBooleans: InvalidValues = [{ value: true }, { value: false }];

const stringify = (value: unknown) => {
  if (typeof value === 'symbol') {
    return 'Symbol()';
  }
  if (typeof value === 'function') {
    return 'function';
  }
  if (value === Number.POSITIVE_INFINITY) {
    return '+∞';
  }
  if (value === Number.NEGATIVE_INFINITY) {
    return '-∞';
  }
  return JSON.stringify(value);
};

export const checkValidator = <T extends OptionType>({
  validator,
  option,
  valid,
  invalid = []
}: {
  validator: OptionValidator<T>;
  option: Option<T>;
  configuration?: Partial<Configuration>;
  valid: { value: unknown; configuration?: Partial<Configuration>; expected?: unknown }[];
  invalid?: InvalidValues;
}) => {
  describe(`validators/${validator.name}`, () => {
    for (const { value, configuration = {}, expected = value } of valid) {
      it(`☒ ${stringify(value)} ➜  ${stringify(expected)}`, async () => {
        const result = await validator(option, value, configuration as Configuration);
        expect(result).toStrictEqual(expected);
      });
    }
    for (const { value, configuration = {}, message } of [...invalidValues, ...invalid]) {
      it(`☐ ${stringify(value)}`, async () => {
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
