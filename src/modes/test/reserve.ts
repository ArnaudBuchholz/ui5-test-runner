import { logger, Path } from '../../platform/index.js';
import type { Configuration as REserveConfiguration } from 'reserve';
import type { Configuration } from '../../configuration/Configuration.js';

export const buildREserveConfiguration = (configuration: Configuration): REserveConfiguration => {
  const match = /\/((?:test-)?resources\/.*)/; // Captured value never starts with /
  let { ui5 } = configuration;
  if (!ui5.endsWith('/')) {
    ui5 += '/';
  }
  const ui5Mapping = new URL('$1', ui5).href;
  const webapp = Path.join(configuration.webapp, '.'); // strips trailing slash (REserve requires no trailing slash)

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

  const libMappings: REserveConfiguration['mappings'] = (configuration.lib ?? []).flatMap(
    ({ resourcesSubFolder, sourceFolder }) => {
      // eslint-disable-next-line security/detect-non-literal-regexp -- resourcesSubFolder is validated
      const match = new RegExp(String.raw`^/resources/${resourcesSubFolder}/(.*?)(?:\?.*)?$`);
      const useInstrumented = configuration.coverage && sourceFolder.startsWith(configuration.cwd);
      if (useInstrumented) {
        const instrumentedCwd = Path.join(
          configuration.coverageTempDir,
          'instrumented',
          sourceFolder.slice(configuration.cwd.length)
        );
        return [
          { match, cwd: instrumentedCwd, file: '$1' },
          { match, cwd: sourceFolder, file: '$1' }
        ];
      }
      return [{ match, cwd: sourceFolder, file: '$1' }];
    }
  );

  return {
    port: configuration.port ?? 0,
    mappings: [
      ...libMappings,
      {
        method: 'GET,HEAD',
        match,
        url: ui5Mapping,
        'ignore-unverifiable-certificate': true
      },
      ...coverageMappings,
      {
        // Project mapping
        match: /^\/(.*)/,
        cwd: webapp,
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
