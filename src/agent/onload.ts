import { state } from './state.js';
import { suite } from './suite.js';
import { qunit } from './qunit.js';
import type { AgentState } from '../types/AgentState.js';
import { log } from './log.js';

export const DETECTION_TIMEOUT = 5000;
const DELAY = 100;
const MAX_DELAY = 1000;

window.addEventListener('load', () => {
  log('DOM load event fired');
  const loaded = Date.now();
  state.loaded = loaded;
  let delay = DELAY;
  const detect = () => {
    if (typeof window.suite === 'function') {
      log('suite detected');
      void suite();
    } else if (window.QUnit !== undefined) {
      log('QUnit detected');
      qunit();
    } else if (Date.now() - loaded < DETECTION_TIMEOUT) {
      delay = Math.min(MAX_DELAY, delay * 2);
      log(`Waiting ${delay}ms before next detection attempt`);
      setTimeout(detect, delay);
    } else {
      log.error('Nothing detected');
      const newState: AgentState = {
        done: true,
        type: 'unknown'
      };
      Object.assign(state, newState);
    }
  };
  detect();
});
