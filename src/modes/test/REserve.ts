import { Http, logger } from '../../platform/index.js';
import type { Configuration as REserveConfiguration } from 'reserve';
import type { Configuration } from '../../configuration/Configuration.js';

export const buildREserveConfiguration = async (
  configuration: Configuration
): Promise<REserveConfiguration> => {

  const match = /\/((?:test-)?resources\/.*)/; // Captured value never starts with /
  let { ui5 } = configuration;
  if (!ui5.endsWith('/')) {
    ui5 += '/';
  }
  const mappingUrl = new URL('$1', ui5).toString();

  const versionUrl = mappingUrl.replace('$1', 'resources/sap-ui-version.json');
  const version = JSON.parse(await Http.get(versionUrl));
  const { version: coreVersion } = version.libraries.find(({ name }: { name: string }) => name === 'sap.ui.core')
  logger.info({ source: 'server', message: `UI5 version used by the local server: ${coreVersion}` });
  
  return {
    port: configuration.port,
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
