import type { QUnit } from 'qunit';
import type { UI5_TEST_RUNNER } from './contants.js';
import type { State } from './state.js';

declare global {
  interface Window {
    __coverage__?: unknown;
    suite?: () => void;
    sap?: { ui?: { test?: { Opa5?: object } } };
    QUnit?: QUnit;
    /** Managed by the agent */
    [UI5_TEST_RUNNER]: {
      state: State;
    };
  }
}
