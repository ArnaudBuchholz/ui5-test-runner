import { IS_IN_IFRAME } from './contants.js';

// TODO: how to make sure it is added to each IFrame ?

export const setCoverageHandler = (window: Window) => {
  const top = window.top!; // not null in IFrame
  Object.defineProperty(window, '__coverage__', {
    get() {
      return top.__coverage__;
    },
    set(value) {
      top.__coverage__ = value;
      return true;
    }
  });
};

/* v8 ignore next -- @preserve */
if (IS_IN_IFRAME) {
  setCoverageHandler(window);
}
