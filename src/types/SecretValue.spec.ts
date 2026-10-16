import { describe, it, expect } from 'vitest';
import { SecretValue } from './SecretValue.js';
import { isSecretValue } from './ISecretValue.js';

describe('SecretValue', () => {
  it('reveal() returns the raw value', () => {
    expect(new SecretValue('abc').reveal()).toBe('abc');
  });

  it('toJSON() returns ***', () => {
    expect(new SecretValue('abc').toJSON()).toBe('***');
  });

  it('toString() returns ***', () => {
    expect(new SecretValue('abc').toString()).toBe('***');
  });

  it('JSON.stringify redacts the value', () => {
    expect(JSON.stringify({ password: new SecretValue('abc') })).toBe('{"password":"***"}');
  });
});

describe('isSecretValue', () => {
  it('returns true for SecretValue instance', () => {
    expect(isSecretValue(new SecretValue('x'))).toBe(true);
  });

  it('returns true for a custom implementation with reveal()', () => {
    expect(isSecretValue({ reveal: () => 'x' })).toBe(true);
  });

  it('returns false for a plain string', () => {
    expect(isSecretValue('plain')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isSecretValue(null)).toBe(false);
  });

  it('returns false for an object without reveal', () => {
    expect(isSecretValue({ value: 'x' })).toBe(false);
  });
});
