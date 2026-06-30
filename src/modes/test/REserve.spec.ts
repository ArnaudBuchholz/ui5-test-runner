import { describe, it, expect, beforeAll } from 'vitest';
import { mock } from 'reserve';
import type { Configuration } from '../../configuration/Configuration.js';
import { buildREserveConfiguration } from './REserve.js';
import { logger } from '../../platform/logger.js';

const UNHANDLED_URL = '/not-found.js';

const configuration = {
  ui5: 'https://ui5.sap.com',
  webapp: '/webapp'
} as unknown as Configuration;

let server: ReturnType<typeof mock>;

beforeAll(async () => {
  server = mock(buildREserveConfiguration(configuration));
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
