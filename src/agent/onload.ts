import { state } from './state.js';
import { suite } from './suite.js';
import { qunit } from './qunit.js';

window.addEventListener('load', () => {
  state.loaded = Date.now();
  if (typeof window.suite === 'function') {
    suite();
  } else if (typeof window.QUnit === 'undefined') {
    // Not sure what to do
  } else {
    qunit();
  }
});
