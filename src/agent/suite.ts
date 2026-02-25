import type { AgentState } from '../types/AgentState.js';
import { state } from './state.js';

let instance: JsUnitTestSuite | undefined;
const { promise, resolve } = Promise.withResolvers<void>();

class JsUnitTestSuite {
  constructor() {
    // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias -- Singleton pattern
    instance ??= this;
    return instance;
  }

  private _pages: string[] = [];

  get pages() {
    return this._pages;
  }

  addTestPage(url: string) {
    this._pages.push(url);
    resolve();
  }
}

Object.assign(window, { jsUnitTestSuite: JsUnitTestSuite });

export const suite = () => {
  window.suite?.();
  void promise.then(() => {
    const newState: AgentState = {
      done: true,
      type: 'suite',
      pages: instance?.pages ?? []
    };
    Object.assign(state, newState);
  });
};
