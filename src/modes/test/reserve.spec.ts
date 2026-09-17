import { describe, it, expect, beforeAll } from 'vitest';
import { mock } from 'reserve';
import type { Configuration } from '../../configuration/Configuration.js';
import { buildREserveConfiguration } from './reserve.js';
import { logger } from '../../platform/logger.js';

const UNHANDLED_URL = '/not-found.js';

const CONFIGURATION = {
  ui5: 'https://ui5.sap.com',
  webapp: '/webapp/'
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
    webapp: '/webapp/',
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

  describe('webapp trailing slash', () => {
    it('strips trailing slash so REserve can serve files correctly', () => {
      const config = {
        ...BASE_CONFIG,
        ui5: 'https://ui5.sap.com/',
        webapp: '/the/webapp/'
      } as unknown as Configuration;
      const result = buildREserveConfiguration(config);
      const mappings = result.mappings as Array<{ cwd?: string }>;
      const projectMapping = mappings.find((m) => m.cwd === '/the/webapp');
      expect(projectMapping).toBeDefined();
    });
  });

  describe('lib mappings', () => {
    it('adds a file mapping per lib entry before the project mapping', () => {
      const config = {
        ...BASE_CONFIG,
        cwd: '/project',
        ui5: 'https://ui5.sap.com/',
        lib: [
          { resourcesSubFolder: 'sap/utr/lib', sourceFolder: '/project/src/sap/utr/lib' },
          { resourcesSubFolder: 'sap/other', sourceFolder: '/project/src/other' }
        ]
      } as unknown as Configuration;
      const result = buildREserveConfiguration(config);
      const mappings = result.mappings as Array<{ match?: RegExp; cwd?: string; file?: string }>;
      const libMappings = mappings.filter((m) => m.cwd?.startsWith('/project/src/'));
      expect(libMappings).toHaveLength(2);
      // eslint-disable-next-line security/detect-unsafe-regex, sonarjs/super-linear-regex -- kind of safe
      expect(libMappings[0]!.match).toEqual(/^\/resources\/sap\/utr\/lib\/(.*?)(?:\?.*)?$/);
      expect(libMappings[0]!.cwd).toBe('/project/src/sap/utr/lib');
      expect(libMappings[0]!.file).toBe('$1');
      // eslint-disable-next-line security/detect-unsafe-regex, sonarjs/super-linear-regex -- kind of safe
      expect(libMappings[1]!.match).toEqual(/^\/resources\/sap\/other\/(.*?)(?:\?.*)?$/);
      expect(libMappings[1]!.cwd).toBe('/project/src/other');
    });

    it('serves lib files from instrumented folder first, then source folder, when coverage is enabled and sourceFolder is under cwd', () => {
      const config = {
        ...BASE_CONFIG,
        cwd: '/project',
        ui5: 'https://ui5.sap.com/',
        coverage: true,
        lib: [{ resourcesSubFolder: 'sap/utr/lib', sourceFolder: '/project/src/sap/utr/lib' }]
      } as unknown as Configuration;
      const result = buildREserveConfiguration(config);
      const mappings = result.mappings as Array<{ match?: RegExp; cwd?: string }>;
      const LIB_MATCH_STRING = String.raw`/^\/resources\/sap\/utr\/lib\/(.*?)(?:\?.*)?$/`;
      const libMappings = mappings.filter((m) => m.match?.toString() === LIB_MATCH_STRING);
      expect(libMappings).toHaveLength(2);
      expect(libMappings[0]!.cwd).toBe('/tmp/coverage/instrumented/src/sap/utr/lib');
      expect(libMappings[1]!.cwd).toBe('/project/src/sap/utr/lib');
    });

    it('serves lib files from the original folder when coverage is enabled but sourceFolder is outside cwd', () => {
      const config = {
        ...BASE_CONFIG,
        cwd: '/project',
        ui5: 'https://ui5.sap.com/',
        coverage: true,
        lib: [{ resourcesSubFolder: 'sap/utr/lib', sourceFolder: '/external/src/sap/utr/lib' }]
      } as unknown as Configuration;
      const result = buildREserveConfiguration(config);
      const mappings = result.mappings as Array<{ match?: RegExp; cwd?: string }>;
      const LIB_MATCH_STRING = String.raw`/^\/resources\/sap\/utr\/lib\/(.*?)(?:\?.*)?$/`;
      const libMappings = mappings.filter((m) => m.match?.toString() === LIB_MATCH_STRING);
      expect(libMappings).toHaveLength(1);
      expect(libMappings[0]!.cwd).toBe('/external/src/sap/utr/lib');
    });

    it('adds no lib mappings when lib is undefined', () => {
      const config = { ...BASE_CONFIG, cwd: '/project', ui5: 'https://ui5.sap.com/' } as unknown as Configuration;
      const result = buildREserveConfiguration(config);
      const mappings = result.mappings as Array<{ cwd?: string }>;
      const libMappings = mappings.filter((m) => m.cwd?.startsWith('/project/src/'));
      expect(libMappings).toHaveLength(0);
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
