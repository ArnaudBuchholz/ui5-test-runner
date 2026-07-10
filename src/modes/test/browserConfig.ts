import { options } from '../../configuration/options.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { toPlainObject, pick } from '../../utils/shared/object.js';
import { anonymize } from '../../utils/node/anonymize.js';

const UI5_TEST_RUNNER = 'ui5-test-runner';

const browserExposedKeys = options
  .filter((option) => 'browserExposed' in option)
  .map(({ name }) => name) as (keyof Configuration)[];

let _browserConfigScript: string | undefined;

export const initBrowserConfig = (configuration: Configuration): void => {
  const payload = anonymize(pick(toPlainObject(configuration) as Configuration, browserExposedKeys));
  _browserConfigScript = `(function(){window['${UI5_TEST_RUNNER}']=window['${UI5_TEST_RUNNER}']||{};window['${UI5_TEST_RUNNER}'].config=${JSON.stringify(payload)};})();`;
};

export const getBrowserConfigScript = (): string => {
  if (_browserConfigScript === undefined) {
    throw new Error('browserConfig not initialized');
  }
  return _browserConfigScript;
};
