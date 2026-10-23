import { options } from '../../configuration/options.js';
import type { Configuration } from '../../configuration/Configuration.js';
import { toPlainObject, pick } from '../../utils/shared/object.js';
import { assert } from '../../platform/index.js';

const UI5_TEST_RUNNER = 'ui5-test-runner';

const browserExposedKeys = options
  .filter((option) => 'browserExposed' in option)
  .map(({ name }) => name) as (keyof Configuration)[];

// RegExp does not survive JSON serialization, so browser-exposed regexp options are
// serialized to their source string; the agent recompiles them with new RegExp().
const serializeRegExps = (_key: string, value: unknown): unknown => (value instanceof RegExp ? value.source : value);

let _browserConfigScript: string | undefined;

export const initBrowserConfig = (configuration: Configuration): void => {
  const payload = pick(toPlainObject(configuration) as Configuration, browserExposedKeys);
  _browserConfigScript = `(function(){window['${UI5_TEST_RUNNER}']=window['${UI5_TEST_RUNNER}']||{};window['${UI5_TEST_RUNNER}'].config=${JSON.stringify(payload, serializeRegExps)};})();`;
};

export const getBrowserConfigScript = (pageId: number): string => {
  assert(_browserConfigScript !== undefined, 'browserConfig not initialized');
  return _browserConfigScript + `(function(){window['${UI5_TEST_RUNNER}'].config.pageId=${pageId};})();`;
};
