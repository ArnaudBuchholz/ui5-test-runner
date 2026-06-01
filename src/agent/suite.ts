import type { AgentState } from '../types/AgentState.js';
import { state } from './state.js';
import { log } from './log.js';

export class JsUnitTestSuite {
  // eslint-disable-next-line sonarjs/public-static-readonly -- to enable testing
  static pages: string[] | undefined;

  constructor() {
    log('custom JsUnitTestSuite built');
    JsUnitTestSuite.pages = [];
  }

  addTestPage(url: string) {
    log(`addTestPage('${url}')`);
    JsUnitTestSuite.pages!.push(url);
  }
}

Object.assign(window, { jsUnitTestSuite: JsUnitTestSuite });

export const suite = async () => {
  log('executing suite');
  await window.suite?.();
  log('suite executed');
  const newState: AgentState = JsUnitTestSuite.pages
    ? {
        done: true,
        type: 'suite',
        pages: JsUnitTestSuite.pages
      }
    : {
        done: true,
        type: 'unknown'
      };
  Object.assign(state, newState);
};
