import { logger, Path } from '../../platform/index.js';
import type { Configuration as REserveConfiguration } from 'reserve';
import type { Configuration } from '../../configuration/Configuration.js';

export const buildREserveConfiguration = (configuration: Configuration): REserveConfiguration => {
  const match = /\/((?:test-)?resources\/.*)/; // Captured value never starts with /
  let { ui5 } = configuration;
  if (!ui5.endsWith('/')) {
    ui5 += '/';
  }
  const mappingUrl = new URL('$1', ui5).href;

  const coverageMappings: REserveConfiguration['mappings'] = configuration.coverage
    ? [
        {
          // eslint-disable-next-line security/detect-unsafe-regex, sonarjs/super-linear-regex -- kind of safe
          match: /(.*\.js)(\?.*)?$/,
          cwd: Path.join(configuration.coverageTempDir, 'instrumented'),
          file: '$1'
        }
      ]
    : [];

  return {
    port: configuration.port ?? 0,
    mappings: [
      {
        method: 'GET,HEAD',
        match,
        url: mappingUrl,
        'ignore-unverifiable-certificate': true
      },
      ...coverageMappings,
      {
        // Project mapping
        match: /^\/(.*)/,
        cwd: configuration.webapp,
        file: '$1'
        // static: !configuration.watch && !configuration.debugDevMode
      },
      {
        custom: (request) => logger.warn({ source: 'server/unhandled', message: request.url! })
      },
      {
        status: 404
      }
    ]
  };
};
