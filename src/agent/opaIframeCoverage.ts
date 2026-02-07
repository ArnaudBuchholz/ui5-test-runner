import { IN_IFRAME } from './contants.js';

// TODO: how to make sure it is added to each IFrame ?
if (IN_IFRAME) {
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
}
