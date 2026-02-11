import type { AgentState } from '../types/AgentState.js';
import { state } from './state.js';

class JsUnitTestSuite {
  private static _pages: string[] = [];

  static get pages() {
    return this._pages;
  }

  static addTestPage(url: string) {
    this._pages.push(url);
  }
}

Object.assign(window, { jsUnitTestSuite: JsUnitTestSuite });

export const suite = () => {
  window.suite?.();
  const newState: AgentState = {
    done: true,
    type: 'suite',
    pages: JsUnitTestSuite.pages
  };
  Object.assign(state, newState);
};
