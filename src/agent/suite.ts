import type { AgentState } from '../types/AgentState.js';
import { state } from './state.js';

export class JsUnitTestSuite {
  // eslint-disable-next-line sonarjs/public-static-readonly -- to enable testing
  static pages: string[] | undefined;

  constructor() {
    JsUnitTestSuite.pages = [];
  }

  addTestPage(url: string) {
    JsUnitTestSuite.pages!.push(url);
  }
}

Object.assign(window, { jsUnitTestSuite: JsUnitTestSuite });

export const suite = () => {
  window.suite?.();
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
