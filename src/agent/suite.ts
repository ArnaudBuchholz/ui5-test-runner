import type { State } from './state.js';
import { state } from './state.js';

class jsUnitTestSuite {
  private static _pages: string[] = [];

  static get pages() {
    return this._pages;
  }

  static addTestPage(url: string) {
    this._pages.push(url);
  }
}

Object.assign(window, { jsUnitTestSuite });

export const suite = async () => {
  await window.suite?.();
  const newState: State = {
    done: true,
    type: 'suite',
    pages: jsUnitTestSuite.pages
  };
  Object.assign(state, newState);
};
