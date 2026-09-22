import type { IError } from '../../types/IError.js';

export const toIError = (error?: unknown): IError => {
  if (!(error instanceof Error)) {
    return toIError(new Error(JSON.stringify(error)));
  }
  const attributes: IError = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    // eslint-disable-next-line unicorn/consistent-conditional-object-spread -- fails with typescript error, no time to qualify
    ...(error.cause ? { cause: toIError(error.cause) } : {}),
    ...(error instanceof AggregateError && { errors: error.errors.map((item) => toIError(item)) })
  };
  return attributes;
};
