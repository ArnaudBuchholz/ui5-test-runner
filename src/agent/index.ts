import './opaIframeCoverage.js';
import './onload.js';
import { UI5_TEST_RUNNER } from './contants.js';
import { state } from './state.js';

window[UI5_TEST_RUNNER] = {
  state
};
