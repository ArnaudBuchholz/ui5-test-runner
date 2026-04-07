import { describe, it, expect } from 'vitest';
import { buildFilterExpression } from './filter.js';

describe('buildFilterExpression', () => {
  describe('when existingFilter is empty', () => {
    it('returns the expression alone for a string value', () => {
      expect(buildFilterExpression('source', 'job', '===', '')).toBe('source === "job"');
    });

    it('returns the expression alone for a numeric value', () => {
      expect(buildFilterExpression('processId', 16_616, '===', '')).toBe('processId === 16616');
    });

    it('returns the expression alone for a boolean value', () => {
      expect(buildFilterExpression('autorefresh', true, '===', '')).toBe('autorefresh === true');
    });

    it('uses !== operator when specified', () => {
      expect(buildFilterExpression('level', 'error', '!==', '')).toBe('level !== "error"');
    });
  });

  describe('when existingFilter is non-empty', () => {
    it('chains the new expression with && for string value', () => {
      const result = buildFilterExpression('source', 'job', '===', 'level === "info"');
      expect(result).toBe('level === "info" && source === "job"');
    });

    it('chains the new expression with && for numeric value', () => {
      const result = buildFilterExpression('processId', 42, '!==', 'source === "job"');
      expect(result).toBe('source === "job" && processId !== 42');
    });
  });

  describe('data field notation', () => {
    it('supports dot-notation field paths', () => {
      expect(buildFilterExpression('data.testName', 'open app', '===', '')).toBe('data.testName === "open app"');
    });
  });
});
