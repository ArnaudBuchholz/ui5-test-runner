import type { IError } from '../../types/IError.js';

export const toIError = (error?: unknown): IError => {
  if (!(error instanceof Error)) {
    return toIError(new Error(JSON.stringify(error)));
  }
  const attributes: IError = {
    name: error.name,
    message: error.message,
    stack: error.stack
  };
  if (error.cause) {
    attributes.cause = toIError(error.cause);
  }
  if (error instanceof AggregateError) {
    attributes.errors = error.errors.map((item) => toIError(item));
  }
  return attributes;
};
