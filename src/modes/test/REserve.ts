import type { Configuration as REserveConfiguration } from 'reserve';
import type { Configuration } from '../../configuration/Configuration.js';

export const buildREserveConfiguration = (configuration: Configuration): REserveConfiguration => {
  const match = /\/((?:test-)?resources\/.*)/; // Captured value never starts with /
  let { ui5 } = configuration;
  if (!ui5.endsWith('/')) {
    ui5 += '/';
  }
  const mappingUrl = new URL('$1', ui5).toString();

  return {
    port: configuration.port ?? 0,
    mappings: [
      {
        method: 'GET,HEAD',
        match,
        url: mappingUrl,
        'ignore-unverifiable-certificate': true
      }
    ]
  };
};
