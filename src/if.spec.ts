import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Host } from './platform/index.js';
import { evaluateIf } from './if.js';
import type { Configuration } from './configuration/Configuration.js';

vi.mock('./platform/mock.js');
vi.mock('./platform/version.js');

import { version } from './platform/version.js';

const makeConfig = (condition?: string): Configuration => ({ if: condition }) as Configuration;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(version).mockResolvedValue('ui5-test-runner@6.0.0');
  Object.assign(Host, { version: 'v24.18.0', env: {} });
});

describe('evaluateIf()', () => {
  describe('when condition is not set', () => {
    it('returns true without evaluating anything', async () => {
      const shouldExecute = await evaluateIf(makeConfig());
      expect(shouldExecute).toBe(true);
    });
  });

  describe('context variables', () => {
    it('exposes NODE_MAJOR_VERSION as a number', async () => {
      const shouldExecute = await evaluateIf(makeConfig('NODE_MAJOR_VERSION === 24'));
      expect(shouldExecute).toBe(true);
    });

    it('exposes NODE_VERSIOM (full version string)', async () => {
      const shouldExecute = await evaluateIf(makeConfig('NODE_VERSIOM === "v24.18.0"'));
      expect(shouldExecute).toBe(true);
    });

    it('exposes UI5TR_NAME', async () => {
      const shouldExecute = await evaluateIf(makeConfig('UI5TR_NAME === "ui5-test-runner"'));
      expect(shouldExecute).toBe(true);
    });

    it('exposes UI5TR_VERSION', async () => {
      const shouldExecute = await evaluateIf(makeConfig('UI5TR_VERSION === "6.0.0"'));
      expect(shouldExecute).toBe(true);
    });

    it('exposes Host.env variables', async () => {
      Object.assign(Host, { env: { MY_VAR: 'hello' } });
      const shouldExecute = await evaluateIf(makeConfig('MY_VAR === "hello"'));
      expect(shouldExecute).toBe(true);
    });

    it('exposes compareVersions helper', async () => {
      const shouldExecute = await evaluateIf(makeConfig('compareVersions(UI5TR_VERSION, "5.0.0") === 1'));
      expect(shouldExecute).toBe(true);
    });
  });

  describe('expression evaluation', () => {
    it('returns true when condition evaluates to truthy', async () => {
      const shouldExecute = await evaluateIf(makeConfig('1 === 1'));
      expect(shouldExecute).toBe(true);
    });

    it('returns false when condition evaluates to falsy', async () => {
      const shouldExecute = await evaluateIf(makeConfig('1 === 2'));
      expect(shouldExecute).toBe(false);
    });

    it('returns false when condition evaluates to 0', async () => {
      const shouldExecute = await evaluateIf(makeConfig('0'));
      expect(shouldExecute).toBe(false);
    });

    it('returns false when condition evaluates to empty string', async () => {
      const shouldExecute = await evaluateIf(makeConfig('""'));
      expect(shouldExecute).toBe(false);
    });
  });
});
