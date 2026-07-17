import { describe, it, expect } from 'vitest';
import { compareVersions } from './version.js';

describe('compareVersions (with prerelease support)', () => {
  describe('basic version comparison', () => {
    it('should return -1 when version1 is lower than version2', () => {
      expect(compareVersions('1.2.3', '1.2.4')).toBe(-1);
    });

    it('should return 1 when version1 is higher than version2', () => {
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    });

    it('should return 0 when versions are equal', () => {
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    });
  });

  describe('prerelease versions', () => {
    it('should treat prerelease as lower than release version', () => {
      expect(compareVersions('1.2.3-beta', '1.2.3')).toBe(-1);
    });

    it('should treat release version as higher than prerelease', () => {
      expect(compareVersions('1.2.3', '1.2.3-beta')).toBe(1);
    });

    it('should compare different prerelease identifiers', () => {
      expect(compareVersions('1.2.3-rc.1', '1.2.3-beta')).toBe(1);
    });

    it('should return 0 when prerelease versions are identical', () => {
      expect(compareVersions('1.0.0-alpha', '1.0.0-alpha')).toBe(0);
    });

    it('should handle numeric prerelease identifiers', () => {
      expect(compareVersions('1.0.0-1', '1.0.0-2')).toBe(-1);
    });
  });

  describe('edge cases', () => {
    it('should handle versions with different component counts', () => {
      expect(compareVersions('1.2', '1.2.0')).toBe(0);
    });

    it('should compare numeric components correctly without string comparison', () => {
      expect(compareVersions('1.10.0', '1.2.0')).toBe(1);
    });

    it('should handle major version differences', () => {
      expect(compareVersions('2.0.0', '3.0.0')).toBe(-1);
    });
  });
});
