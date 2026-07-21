import type { Configuration } from '../configuration/Configuration.js';

export const dumpConfig = (configuration: Configuration): void => {
  console.log(JSON.stringify(configuration, null, 2));
};
