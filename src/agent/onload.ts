import { state } from './state.js';

window.addEventListener('load', async () => {
  state.loaded = Date.now();
  if (typeof window.suite === 'function') {
    state.type = 'suite';
    await window.suite();
    state.pages = jsUnitTestSuite.pages;
    state.done = true;
  } else if (typeof QUnit === 'undefined') {
  } else {
    state.type = 'QUnit';
  }
});

