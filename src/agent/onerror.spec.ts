import { it, expect, beforeEach } from 'vitest';
import './onerror.js';
import { state } from './state.js';

beforeEach(() => {
  delete state.uncaughtErrors;
});

const stack = expect.any(String) as string;

it('captures and document global error', () => {
  const error = new ErrorEvent('error', {
    error: new Error('KO')
  });
  window.dispatchEvent(error);
  expect.assert(state.uncaughtErrors !== undefined);
  expect(state.uncaughtErrors.length).toStrictEqual(1);
  expect(state.uncaughtErrors[0]).toStrictEqual({
    event: 'error',
    message: 'KO',
    name: 'Error',
    stack
  });
});

it('captures and document unhandled promise rejection', () => {
  const reason = new Error('Rejection KO');
  const event = new PromiseRejectionEvent('unhandledrejection', {
    promise: Promise.resolve(),
    reason
  });
  window.dispatchEvent(event);
  expect.assert(state.uncaughtErrors !== undefined);
  expect(state.uncaughtErrors.length).toStrictEqual(1);
  expect(state.uncaughtErrors[0]).toStrictEqual({
    event: 'unhandledrejection',
    message: 'Rejection KO',
    name: 'Error',
    stack
  });
});

it('accumulates errors', () => {
  const error1 = new ErrorEvent('error', {
    error: new Error('KO1')
  });
  window.dispatchEvent(error1);
  const error2 = new ErrorEvent('error', {
    error: new Error('KO2')
  });
  window.dispatchEvent(error2);
  expect.assert(state.uncaughtErrors !== undefined);
  expect(state.uncaughtErrors.length).toStrictEqual(2);
  expect(state.uncaughtErrors).toStrictEqual([
    {
      event: 'error',
      message: 'KO1',
      name: 'Error',
      stack
    },
    {
      event: 'error',
      message: 'KO2',
      name: 'Error',
      stack
    }
  ]);
});
