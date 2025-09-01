const helper = require('./helper');
const fs = require('fs');
const path = require('path');

describe('helper.js', () => {
  describe('isInRange', () => {
    it('should return true for version in range', () => {
      const isInRange = helper.isInRange('1.0.0', '2.0.0');
      expect(isInRange('1.5.0')).toBe(true);
    });
    it('should return false for version out of range', () => {
      const isInRange = helper.isInRange('1.0.0', '2.0.0');
      expect(isInRange('2.1.0')).toBe(false);
    });
  });

  describe('_millisToMinutesAndSeconds', () => {
    it('should convert millis to minutes and seconds', () => {
      expect(helper._millisToMinutesAndSeconds(65000)).toBe('1:05');
    });
  });

  describe('incrementLogIndex', () => {
    it('should increment log index', () => {
      expect(helper.incrementLogIndex()).toBeGreaterThanOrEqual(0);
    });
  });

  // Add more tests for async functions if needed, e.g. _cleanUp, _downloadFile, _readCLIArgs, _parseString
});
