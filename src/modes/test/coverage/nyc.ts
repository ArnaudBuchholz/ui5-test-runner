import { Npm } from '../../../Npm.js';
import { Path } from '../../../platform/index.js';
import type { Configuration } from '../../../configuration/Configuration.js';

const cache = new WeakMap<Configuration, Promise<string>>();

export const getNycBin = (configuration: Configuration): Promise<string> => {
  let promise = cache.get(configuration);
  if (!promise) {
    promise = (async () => {
      await Npm.import(configuration, 'nyc');
      const nycRoot = await Npm.resolvePackageDir(configuration, 'nyc');
      return Path.join(nycRoot, 'bin', 'nyc.js');
    })();
    cache.set(configuration, promise);
  }
  return promise;
};
