import { describe, it, expect, beforeAll } from 'vitest';
import { mock } from 'reserve';
import type { Configuration } from '../../configuration/Configuration.js';
import { buildREserveConfiguration } from './reserve.js';
import { logger } from '../../platform/logger.js';

const UNHANDLED_URL = '/not-found.js';

const CONFIGURATION = {
  ui5: 'https://ui5.sap.com',
  webapp: '/webapp'
} as unknown as Configuration;

let server: ReturnType<typeof mock>;

beforeAll(async () => {
  server = mock(buildREserveConfiguration(CONFIGURATION));
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  server.on('ready', () => resolve()).on('error', (error: unknown) => reject(error));
  await promise;
});

describe('unhandled request', () => {
  it('logs a warn with source server/unhandled and the URL as message', async () => {
    const response = await server.request('GET', UNHANDLED_URL);
    await response.waitForFinish();
    expect(response.statusCode).toBe(404);
    expect(logger.warn).toHaveBeenCalledWith({
      source: 'server/unhandled',
      message: UNHANDLED_URL
    });
  });
});

describe('buildREserveConfiguration', () => {
  const BASE_CONFIG = {
    webapp: '/webapp',
    coverageTempDir: '/tmp/coverage'
  } as unknown as Configuration;

  describe('ui5 URL trailing slash', () => {
    it('appends $1 directly when ui5 has no trailing slash', () => {
      const config = { ...BASE_CONFIG, ui5: 'https://ui5.sap.com' } as unknown as Configuration;
      const result = buildREserveConfiguration(config);
      const urlMapping = result.mappings[0] as { url: string };
      expect(urlMapping.url).toBe('https://ui5.sap.com/$1');
    });

    it('produces the same url mapping when ui5 already has a trailing slash', () => {
      const config = { ...BASE_CONFIG, ui5: 'https://ui5.sap.com/' } as unknown as Configuration;
      const result = buildREserveConfiguration(config);
      const urlMapping = result.mappings[0] as { url: string };
      expect(urlMapping.url).toBe('https://ui5.sap.com/$1');
    });
  });

  describe('coverage mappings', () => {
    it('includes an instrumented cwd mapping when coverage is true', () => {
      const config = { ...BASE_CONFIG, ui5: 'https://ui5.sap.com/', coverage: true } as unknown as Configuration;
      const result = buildREserveConfiguration(config);
      const mappings = result.mappings as Array<{ cwd?: string; file?: string }>;
      const coverageMapping = mappings.find((m) => m.cwd?.endsWith('instrumented'));
      expect(coverageMapping).toBeDefined();
      expect(coverageMapping!.file).toBe('$1');
    });

    it('does not include an instrumented cwd mapping when coverage is false', () => {
      const config = { ...BASE_CONFIG, ui5: 'https://ui5.sap.com/', coverage: false } as unknown as Configuration;
      const result = buildREserveConfiguration(config);
      const mappings = result.mappings as Array<{ cwd?: string }>;
      const coverageMapping = mappings.find((m) => m.cwd?.endsWith('instrumented'));
      expect(coverageMapping).toBeUndefined();
    });
  });
});
