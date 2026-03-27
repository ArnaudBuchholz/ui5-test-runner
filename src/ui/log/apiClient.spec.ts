import { describe, it, expect } from 'vitest';
import { levelToString } from './apiClient.js';
import { LogLevel } from '../../platform/logger/types.js';

describe('levelToString', () => {
  it('returns "debug" for level 0', () => {
    expect(levelToString(LogLevel.debug)).toBe('debug');
  });

  it('returns "info" for level 1', () => {
    expect(levelToString(LogLevel.info)).toBe('info');
  });

  it('returns "warn" for level 2', () => {
    expect(levelToString(LogLevel.warn)).toBe('warn');
  });

  it('returns "error" for level 3', () => {
    expect(levelToString(LogLevel.error)).toBe('error');
  });

  it('returns "fatal" for level 4', () => {
    expect(levelToString(LogLevel.fatal)).toBe('fatal');
  });

  it('returns the string representation of an unknown level', () => {
    expect(levelToString(99)).toBe('99');
  });
});
