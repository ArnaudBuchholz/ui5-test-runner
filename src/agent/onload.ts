import { state } from './state.js';
import { suite } from './suite.js';
import { qunit } from './qunit.js';
import { AgentState } from '../types/AgentState.js';

const DETECTION_TIMEOUT = 5_000;
const DELAY = 100;
const MAX_DELAY = 1_000;

window.addEventListener('load', () => {
  const loaded = Date.now();
  state.loaded = loaded;
  let delay = DELAY;
  const detect = () => {
    if (typeof window.suite === 'function') {
      suite();
    } else if (window.QUnit !== undefined) {
      qunit();
    } else if (Date.now() - loaded < DETECTION_TIMEOUT) {
      delay = Math.min(MAX_DELAY, delay * 2);
      setTimeout(detect, delay);
    } else {
      const newState: AgentState = {
        done: true,
        type: 'unknown'
      };
      Object.assign(state, newState);
    }
  }
  detect();
});
