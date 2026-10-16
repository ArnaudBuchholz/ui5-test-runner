import type { Configuration } from '../configuration/Configuration.js';
import { redactSecrets } from '../utils/node/anonymize.js';
import { toPlainObject } from '../utils/shared/object.js';

export const dumpConfig = (configuration: Configuration): void => {
  const safe = redactSecrets(toPlainObject(configuration));
  console.log(JSON.stringify(safe, null, 2));
};
