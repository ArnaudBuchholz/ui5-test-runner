import { describe, it, expect } from 'vitest';
import { prettifyUrl, formatDuration, validateCtrf } from './ctrf.js';

describe('ctrf utils', () => {
  describe('prettifyUrl', () => {
    it('should extract the filename from a URL', () => {
      expect(prettifyUrl('https://example.com/test/Testsuite.html')).toBe('Testsuite.html');
    });

    it('should handle URLs with query parameters', () => {
      expect(prettifyUrl('https://example.com/Test.html?test=unit/unitTests')).toBe('Test.html (unit/unitTests)');
    });

    it('should return the original string if not a URL', () => {
      expect(prettifyUrl('Some string')).toBe('Some string');
    });
  });

  describe('formatDuration', () => {
    it('should format ms correctly', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(1500)).toBe('1s');
      expect(formatDuration(65_000)).toBe('1m 5s');
    });
  });

  describe('validateCtrf', () => {
    it('should return true for valid CTRF', () => {
      const valid = {
        reportFormat: 'CTRF',
        results: {
          summary: {
            tests: 1,
            passed: 1,
            failed: 0,
            skipped: 0,
            start: 0,
            stop: 0,
            duration: 0
          },
          tests: []
        }
      };
      expect(validateCtrf(valid)).toBe(true);
    });

    it('should return false for invalid CTRF', () => {
      expect(validateCtrf({})).toBe(false);
      expect(validateCtrf({ reportFormat: 'OTHER' })).toBe(false);
    });
  });
});
