import { it, expect, beforeAll, beforeEach } from 'vitest';
import { setCoverageHandler } from './opaIframeCoverage.js';

const coverageInfo = {
  uid: Date.now()
} as const;

const indexFrame = {
  top: window
} as unknown as Window;

beforeAll(() => {
  setCoverageHandler(indexFrame);
});

beforeEach(() => {
  delete window.__coverage__;
});

it('creates a property reflecting on the main window (read)', () => {
  window.__coverage__ = coverageInfo;
  expect(indexFrame.__coverage__).toStrictEqual(coverageInfo);
});

it('creates a property reflecting on the main window (write)', () => {
  indexFrame.__coverage__ = coverageInfo;
  expect(window.__coverage__).toStrictEqual(coverageInfo);
});
